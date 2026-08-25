from datetime import datetime, timezone

from fastapi import HTTPException
from postgrest.exceptions import APIError

from app.core.supabase import get_supabase_client
from app.schemas.analytics import AnswerReviewRow, AttemptResult, ResultBreakdown, ReviewOption
from app.schemas.attempt import (
    AttemptQuestionsResponse,
    SaveAnswerRequest,
    SaveAnswerResponse,
    StartAttemptRequest,
    SubmitAttemptResponse,
    TestAttempt,
)
from app.services.mock_data import ANSWER_REVIEW, LIVE_QUESTION, RESULT_BREAKDOWN, SELECTED_TEST, MOCK_QUESTIONS_POOL

ATTEMPTS: dict[str, dict] = {}
ANSWERS: dict[tuple[str, int], dict] = {}
MOCK_ATTEMPT_QUESTIONS: dict[tuple[str, int], dict] = {}


from app.repositories.base import BaseAttemptRepository

class AttemptService:
    def __init__(self, repository: BaseAttemptRepository | None = None):
        from app.repositories.attempt_repository import SupabaseAttemptRepository
        self.repository = repository or SupabaseAttemptRepository()

    def start_attempt(
        self,
        payload: StartAttemptRequest,
        user_id: str,
    ) -> TestAttempt:
        client = get_supabase_client()
        if client and self.repository:
            try:
                test = self.repository.get_test_by_id(payload.testId)
                if not test:
                    raise HTTPException(status_code=404, detail="Requested practice test not found.")
                
                test_id = test["id"]

                # Check if there are any published questions for this test
                has_questions = self.repository.check_published_questions_exist(test["subject_id"], test["topic_id"])
                if not has_questions:
                    raise HTTPException(
                        status_code=400,
                        detail="This practice test does not have any published questions yet. Please select another topic."
                    )

                row = self.repository.create_attempt(user_id, test_id)
                return TestAttempt.model_validate(self._map_attempt(row, answered_count=0))
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))

        return self._start_mock_attempt(payload, user_id)



    def _determine_target_difficulty(self, answers_by_num: list[dict]) -> str:
        current_diff = "easy"
        correct_window = []
        incorrect_total_at_current = 0

        for ans in answers_by_num:
            if ans.get("is_correct") is None:
                continue

            q_diff = ans.get("difficulty") or "easy"
            if q_diff != current_diff:
                current_diff = q_diff
                correct_window = []
                incorrect_total_at_current = 0

            is_correct = ans.get("is_correct")
            correct_window.append(is_correct)

            if len(correct_window) > 5:
                correct_window.pop(0)

            if not is_correct:
                incorrect_total_at_current += 1

            # Promotion: rolling window of size <= 5 has >= 4 correct
            if len(correct_window) >= 1 and sum(1 for x in correct_window if x is True) >= 4:
                if current_diff == "easy":
                    current_diff = "medium"
                elif current_diff == "medium":
                    current_diff = "hard"
                correct_window = []
                incorrect_total_at_current = 0

            # Demotion: 3 total incorrect answers at this level
            elif incorrect_total_at_current >= 3:
                if current_diff == "hard":
                    current_diff = "medium"
                elif current_diff == "medium":
                    current_diff = "easy"
                correct_window = []
                incorrect_total_at_current = 0

        return current_diff

    def get_questions(
        self,
        attempt_id: str,
        user_id: str,
        question_number: int | None = None,
    ) -> AttemptQuestionsResponse:
        client = get_supabase_client()

        if client:
            try:
                attempt = self._get_attempt(attempt_id, user_id)
                test = self._get_test(attempt["test_id"])

                total_questions = 10
                if test.get("settings") and isinstance(test["settings"], dict):
                    total_questions = test["settings"].get("questions", 10)

                answers = self._get_attempt_answers(attempt_id)
                answered_count = sum(1 for ans in answers.values() if ans.get("selected_option_id") is not None)
                current_number = self._clamp_question_number(
                    question_number or min(answered_count + 1, total_questions),
                    total_questions,
                )

                question_link = None
                existing_answer_row = None
                for q_id, ans in answers.items():
                    ans_js = ans.get("answer_json") or {}
                    if ans_js.get("questionNumber") == current_number:
                        question_link = {"question_id": q_id, "marks": ans.get("score") or 1}
                        existing_answer_row = ans
                        break

                if not question_link:
                    # Generate adaptive question
                    ans_list = []
                    for q_id, ans in answers.items():
                        q_num = (ans.get("answer_json") or {}).get("questionNumber")
                        if q_num is not None:
                            try:
                                q_data = self._get_question(q_id)
                                ans_list.append({
                                    "question_number": q_num,
                                    "difficulty": q_data.get("difficulty") or "easy",
                                    "is_correct": ans.get("is_correct")
                                })
                            except Exception:
                                pass
                    ans_list.sort(key=lambda x: x["question_number"])

                    target_diff = self._determine_target_difficulty(ans_list)

                    already_used_ids = list(answers.keys())
                    candidates = (
                        client.table("questions")
                        .select("id,title,prompt,marks,difficulty")
                        .eq("subject_id", test["subject_id"])
                        .eq("topic_id", test["topic_id"])
                        .eq("difficulty", target_diff)
                        .eq("status", "published")
                        .execute()
                        .data
                        or []
                    )
                    unused_candidates = [q for q in candidates if str(q["id"]) not in already_used_ids]

                    if not unused_candidates:
                        fallbacks = []
                        if target_diff == "hard":
                            fallbacks = ["medium", "easy"]
                        elif target_diff == "medium":
                            fallbacks = ["hard", "easy"]
                        else:
                            fallbacks = ["medium", "hard"]

                        for f_diff in fallbacks:
                            candidates = (
                                client.table("questions")
                                .select("id,title,prompt,marks,difficulty")
                                .eq("subject_id", test["subject_id"])
                                .eq("topic_id", test["topic_id"])
                                .eq("difficulty", f_diff)
                                .eq("status", "published")
                                .execute()
                                .data
                                or []
                            )
                            unused_candidates = [q for q in candidates if str(q["id"]) not in already_used_ids]
                            if unused_candidates:
                                target_diff = f_diff
                                break

                    if not unused_candidates:
                        candidates = (
                            client.table("questions")
                            .select("id,title,prompt,marks,difficulty")
                            .eq("subject_id", test["subject_id"])
                            .eq("topic_id", test["topic_id"])
                            .eq("status", "published")
                            .execute()
                            .data
                            or []
                        )
                        unused_candidates = [q for q in candidates if str(q["id"]) not in already_used_ids]

                    if not unused_candidates:
                        raise HTTPException(status_code=400, detail="No unused questions available in pool")

                    selected_q = unused_candidates[0]
                    selected_q_id = str(selected_q["id"])
                    answer_json = {"status": "not_answered", "questionNumber": current_number}

                    insert_response = client.table("test_attempt_answers").insert({
                        "attempt_id": attempt_id,
                        "question_id": selected_q_id,
                        "answer_json": answer_json,
                        "score": 0,
                    }).execute()

                    existing_answer_row = insert_response.data[0]
                    question_link = {"question_id": selected_q_id, "marks": selected_q.get("marks") or 1}

                question = self._get_question(question_link["question_id"])
                options = self._get_options(question_link["question_id"])

                if attempt["current_question"] != current_number:
                    client.table("test_attempts").update({"current_question": current_number}).eq("id", attempt_id).execute()
                    attempt["current_question"] = current_number

                subject_title = ""
                if test.get("subject_id"):
                    subj = client.table("subjects").select("name").eq("id", test["subject_id"]).limit(1).execute().data
                    if subj:
                        subject_title = subj[0].get("name") or ""

                topic_title = ""
                if test.get("topic_id"):
                    top = client.table("topics").select("name").eq("id", test["topic_id"]).limit(1).execute().data
                    if top:
                        topic_title = top[0].get("name") or ""

                return AttemptQuestionsResponse(
                    attempt=TestAttempt.model_validate(
                        self._map_attempt(
                            attempt,
                            current_question=current_number,
                            answered_count=answered_count,
                        )
                    ),
                    question=self._map_question(current_number, question_link, question, options, existing_answer_row),
                    total_questions=total_questions,
                    marked_questions=[],
                    test_title=test.get("title", ""),
                    subject_title=subject_title,
                    topic_title=topic_title,
                )
            except (APIError, IndexError, ValueError):
                pass

        return self._get_mock_questions(attempt_id, user_id)

    def save_answer(
        self,
        attempt_id: str,
        question_id: int,
        payload: SaveAnswerRequest,
        user_id: str,
    ) -> SaveAnswerResponse:
        client = get_supabase_client()

        if client:
            try:
                attempt = self._get_attempt(attempt_id, user_id)
                answers = self._get_attempt_answers(attempt_id)
                actual_question_id = None
                for q_id, ans in answers.items():
                    ans_js = ans.get("answer_json") or {}
                    if ans_js.get("questionNumber") == question_id:
                        actual_question_id = q_id
                        break

                if not actual_question_id:
                    raise ValueError("Question slot not generated yet")

                selected_option = self._get_option(payload.optionId) if payload.optionId else None
                score = 1.0 if selected_option and selected_option.get("is_correct") else 0.0
                answer_json = {"status": payload.status, "questionNumber": question_id}

                response = (
                    client.table("test_attempt_answers")
                    .upsert(
                        {
                            "attempt_id": attempt_id,
                            "question_id": actual_question_id,
                            "selected_option_id": payload.optionId,
                            "answer_json": answer_json,
                            "is_correct": selected_option.get("is_correct") if selected_option else None,
                            "score": score,
                        },
                        on_conflict="attempt_id,question_id",
                    )
                    .execute()
                )
                row = response.data[0]
                return SaveAnswerResponse.model_validate(
                    {
                        "attempt_id": row["attempt_id"],
                        "question_id": question_id,
                        "option_id": row.get("selected_option_id"),
                        "status": payload.status,
                    }
                )
            except (APIError, IndexError, ValueError):
                pass

        return self._save_mock_answer(
            attempt_id,
            question_id,
            payload,
            user_id,
        )

    def submit_attempt(
        self,
        attempt_id: str,
        user_id: str,
    ) -> SubmitAttemptResponse:
        client = get_supabase_client()

        if client:
            try:
                result = self._calculate_result(attempt_id, user_id)
                (
                    client.table("test_attempts")
                    .update(
                        {
                            "status": "submitted",
                            "submitted_at": datetime.now(timezone.utc).isoformat(),
                            "score": result.correct,
                            "percentage": result.overall_score,
                        }
                    )
                    .eq("id", attempt_id)
                    .eq("user_id", user_id)
                    .execute()
                )
                return SubmitAttemptResponse(
                    attempt_id=attempt_id,
                    status="SUBMITTED",
                    result_url=f"/practice-tests/results?attemptId={attempt_id}",
                )
            except (APIError, ValueError):
                pass

        attempt = self._get_mock_attempt(attempt_id, user_id)
        attempt["status"] = "SUBMITTED"

        return SubmitAttemptResponse(
            attempt_id=attempt_id,
            status="SUBMITTED",
            result_url=f"/practice-tests/results?attemptId={attempt_id}",
        )

    def get_result(self, attempt_id: str, user_id: str) -> AttemptResult:
        client = get_supabase_client()

        if client:
            try:
                return self._calculate_result(attempt_id, user_id)
            except (APIError, ValueError):
                pass

        # MOCK RESULT CALCULATION
        attempt = self._get_mock_attempt(attempt_id, user_id)

        correct = 0
        incorrect = 0
        skipped = 0
        review_rows: list[AnswerReviewRow] = []

        attempt_qs = [(num, q) for (a_id, num), q in MOCK_ATTEMPT_QUESTIONS.items() if a_id == attempt_id]
        attempt_qs.sort(key=lambda x: x[0])

        for num, q in attempt_qs:
            ans = ANSWERS.get((attempt_id, q["id"]))
            is_correct = False
            status = "Skipped"
            selected_option_id = None

            if ans and ans.get("option_id"):
                selected_option_id = str(ans.get("option_id"))
                correct_opt = next((o for o in q["options"] if o.get("is_correct")), None)
                if correct_opt and correct_opt["id"] == ans.get("option_id"):
                    correct += 1
                    status = "Correct"
                else:
                    incorrect += 1
                    status = "Incorrect"
            else:
                skipped += 1

            correct_option_id = next((str(o["id"]) for o in q["options"] if o.get("is_correct")), None)

            mapped_options = [
                ReviewOption(
                    id=str(opt["id"]),
                    option_key=opt.get("option_key") or chr(64 + idx),
                    option_text=opt.get("option_text") or "",
                    is_correct=bool(opt.get("is_correct")),
                )
                for idx, opt in enumerate(q["options"], start=1)
            ]

            explanation = q.get("explanation") or ""
            if not explanation:
                correct_opt_text = next((o.get("option_text") or "" for o in q["options"] if o.get("is_correct")), "the correct option")
                explanation = f"The correct answer is '{correct_opt_text}'. This choice is correct because it satisfies all conditions stated in the question. You can verify this by checking each option against the problem statements."

            review_rows.append(
                AnswerReviewRow(
                    id=str(num).zfill(2),
                    preview=q["prompt"][:80],
                    status=status,
                    topic="Aptitude Practice",
                    question_text=q["prompt"],
                    options=mapped_options,
                    selected_option_id=selected_option_id,
                    correct_option_id=correct_option_id,
                    explanation=explanation,
                )
            )

        total_questions = max(len(attempt_qs), 1)
        overall_score = round((correct / total_questions) * 100)

        return AttemptResult(
            attempt_id=attempt_id,
            title="Adaptive Practice Test",
            overall_score=overall_score,
            correct=correct,
            incorrect=incorrect,
            skipped=skipped,
            time_taken="15:30",
            percentile="85th",
            breakdown=[
                ResultBreakdown(label="Number Theory", score=85),
                ResultBreakdown(label="Factors & Multiples", score=70),
                ResultBreakdown(label="Prime Identification", score=90),
            ],
            answer_review=review_rows,
        )

    def _resolve_test_id(self, requested_test_id: str) -> str:
        client = get_supabase_client()
        if not client:
            raise ValueError("Supabase client unavailable")

        rows = client.table("tests").select("id").eq("id", requested_test_id).limit(1).execute().data or []
        if rows:
            return rows[0]["id"]

        fallback_rows = client.table("tests").select("id").order("created_at").limit(1).execute().data or []
        if not fallback_rows:
            raise ValueError("No tests available")
        return fallback_rows[0]["id"]

    def _get_attempt(self, attempt_id: str, user_id: str) -> dict:
        client = get_supabase_client()
        if not client:
            raise ValueError("Supabase client unavailable")

        rows = (
            client.table("test_attempts")
            .select("*")
            .eq("id", attempt_id)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
            .data
            or []
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Attempt not found")
        return rows[0]

    def _get_ordered_test_questions(self, test_id: str) -> list[dict]:
        client = get_supabase_client()
        if not client:
            raise ValueError("Supabase client unavailable")

        return (
            client.table("test_questions")
            .select("question_id,sort_order,section_label,marks")
            .eq("test_id", test_id)
            .order("sort_order")
            .execute()
            .data
            or []
        )

    def _get_question(self, question_id: str) -> dict:
        client = get_supabase_client()
        if not client:
            raise ValueError("Supabase client unavailable")

        rows = (
            client.table("questions")
            .select("id,title,prompt,marks,difficulty")
            .eq("id", question_id)
            .limit(1)
            .execute()
            .data
            or []
        )
        if not rows:
            raise ValueError("Question not found")
        return rows[0]

    def _get_options(self, question_id: str) -> list[dict]:
        client = get_supabase_client()
        if not client:
            raise ValueError("Supabase client unavailable")

        return (
            client.table("question_options")
            .select("id,option_key,option_text,is_correct,sort_order")
            .eq("question_id", question_id)
            .order("sort_order")
            .execute()
            .data
            or []
        )

    def _get_option(self, option_id: str) -> dict | None:
        client = get_supabase_client()
        if not client:
            raise ValueError("Supabase client unavailable")

        rows = (
            client.table("question_options")
            .select("id,is_correct")
            .eq("id", option_id)
            .limit(1)
            .execute()
            .data
            or []
        )
        return rows[0] if rows else None

    def _get_attempt_answers(self, attempt_id: str) -> dict[str, dict]:
        client = get_supabase_client()
        if not client:
            raise ValueError("Supabase client unavailable")

        rows = (
            client.table("test_attempt_answers")
            .select("question_id,selected_option_id,is_correct,score,answer_json")
            .eq("attempt_id", attempt_id)
            .execute()
            .data
            or []
        )
        return {str(row["question_id"]): row for row in rows}

    def _map_attempt(
        self,
        row: dict,
        current_question: int = 1,
        answered_count: int = 0,
    ) -> dict:
        return {
            "id": str(row["id"]),
            "user_id": str(row["user_id"]),
            "test_id": str(row["test_id"]),
            "status": self._api_status(row.get("status", "in_progress")),
            "current_question": current_question,
            "answered_count": answered_count,
        }

    def _map_question(
        self,
        question_number: int,
        question_link: dict,
        question: dict,
        options: list[dict],
        answer: dict | None,
    ) -> dict:
        return {
            "id": question_number,
            "points": int(question_link.get("marks") or question.get("marks") or 1),
            "text": question.get("prompt") or question.get("title") or "",
            "options": [
                {
                    "id": str(option["id"]),
                    "label": option.get("option_key") or chr(64 + index),
                    "value": option.get("option_text") or "",
                }
                for index, option in enumerate(options, start=1)
            ],
            "answer_id": answer.get("selected_option_id") if answer else None,
        }

    def _calculate_result(self, attempt_id: str, user_id: str) -> AttemptResult:
        attempt = self._get_attempt(attempt_id, user_id)
        test = self._get_test(attempt["test_id"])
        answers = self._get_attempt_answers(attempt_id)

        ordered_answers = []
        for q_id, ans in answers.items():
            q_num = (ans.get("answer_json") or {}).get("questionNumber")
            if q_num is not None:
                ordered_answers.append((q_num, q_id, ans))

        ordered_answers.sort(key=lambda x: x[0])

        correct = 0
        incorrect = 0
        skipped = 0
        review_rows: list[AnswerReviewRow] = []

        for index, q_id, answer in ordered_answers:
            question = self._get_question(q_id)
            options = self._get_options(q_id)

            selected_option_id = None
            if not answer or not answer.get("selected_option_id"):
                skipped += 1
                status = "Skipped"
            elif answer.get("is_correct"):
                correct += 1
                status = "Correct"
                selected_option_id = str(answer.get("selected_option_id"))
            else:
                incorrect += 1
                status = "Incorrect"
                selected_option_id = str(answer.get("selected_option_id"))

            correct_option_id = None
            for opt in options:
                if opt.get("is_correct"):
                    correct_option_id = str(opt["id"])
                    break

            mapped_options = [
                ReviewOption(
                    id=str(opt["id"]),
                    option_key=opt.get("option_key") or chr(64 + idx),
                    option_text=opt.get("option_text") or "",
                    is_correct=bool(opt.get("is_correct")),
                )
                for idx, opt in enumerate(options, start=1)
            ]

            metadata = question.get("metadata") or {}
            explanation = metadata.get("explanation") or metadata.get("solution") or ""
            if not explanation:
                correct_opt_text = next((o.get("option_text") or "" for o in options if o.get("is_correct")), "the correct option")
                explanation = f"The correct answer is '{correct_opt_text}'. This choice is correct because it satisfies all conditions stated in the question. You can verify this by checking each option against the problem statements."

            review_rows.append(
                AnswerReviewRow(
                    id=str(index).zfill(2),
                    preview=(question.get("prompt") or "")[:80],
                    status=status,
                    topic=test.get("title", "Practice Test"),
                    question_text=question.get("prompt") or "",
                    options=mapped_options,
                    selected_option_id=selected_option_id,
                    correct_option_id=correct_option_id,
                    explanation=explanation,
                )
            )

        total_questions = max(len(ordered_answers), 1)
        overall_score = round((correct / total_questions) * 100)
        percentile = self._calculate_percentile(attempt["test_id"], overall_score)

        client = get_supabase_client()
        subtopic_stats = {}
        if client:
            try:
                for index, q_id, answer in ordered_answers:
                    q_row = client.table("questions").select("id, prompt, subtopic_id, subtopics(name), topic_id, topics(name)").eq("id", q_id).limit(1).execute().data
                    q_data = q_row[0] if q_row else {}
                    
                    subtopic_name = None
                    if q_data.get("subtopics") and isinstance(q_data["subtopics"], dict):
                        subtopic_name = q_data["subtopics"].get("name")
                    if not subtopic_name and q_data.get("topics") and isinstance(q_data["topics"], dict):
                        subtopic_name = q_data["topics"].get("name")
                    if not subtopic_name:
                        subtopic_name = "General Practice"
                        
                    if subtopic_name not in subtopic_stats:
                        subtopic_stats[subtopic_name] = {"correct": 0, "total": 0}
                        
                    subtopic_stats[subtopic_name]["total"] += 1
                    if answer and answer.get("is_correct"):
                        subtopic_stats[subtopic_name]["correct"] += 1
            except Exception:
                pass

        breakdown = []
        for name, stats in subtopic_stats.items():
            pct = round((stats["correct"] / stats["total"]) * 100)
            breakdown.append(ResultBreakdown(label=name, score=pct))

        if not breakdown:
            breakdown = [ResultBreakdown(label="Practice Test", score=overall_score)]

        return AttemptResult(
            attempt_id=attempt_id,
            title=test.get("title", "Practice Test"),
            overall_score=overall_score,
            correct=correct,
            incorrect=incorrect,
            skipped=skipped,
            time_taken=self._time_taken(attempt),
            percentile=percentile,
            breakdown=breakdown,
            answer_review=review_rows,
        )

    def _calculate_percentile(self, test_id: str, current_score: float) -> str:
        client = get_supabase_client()
        if not client:
            return "50th"

        try:
            rows = (
                client.table("test_attempts")
                .select("percentage")
                .eq("test_id", test_id)
                .eq("status", "submitted")
                .execute()
                .data
                or []
            )
            if not rows:
                return "100th"

            all_scores = [float(row.get("percentage") or 0) for row in rows]
            lower_scores = sum(1 for s in all_scores if s < current_score)
            total = len(all_scores)

            percentile_val = int((lower_scores / total) * 100) if total > 0 else 100

            if 11 <= percentile_val <= 13:
                suffix = "th"
            else:
                suffix = {1: "st", 2: "nd", 3: "rd"}.get(percentile_val % 10, "th")

            return f"{percentile_val}{suffix}"
        except Exception:
            return "85th"

    def _get_test(self, test_id: str) -> dict:
        client = get_supabase_client()
        if not client:
            raise ValueError("Supabase client unavailable")

        rows = client.table("tests").select("id,title,subject_id,topic_id,settings").eq("id", test_id).limit(1).execute().data or []
        if not rows:
            raise ValueError("Test not found")
        return rows[0]

    def _answered_count(self, answers: dict[str, dict]) -> int:
        return sum(1 for answer in answers.values() if answer.get("selected_option_id"))

    def _marked_numbers(self, ordered_questions: list[dict], answers: dict[str, dict]) -> list[int]:
        marked = []
        for index, question_link in enumerate(ordered_questions, start=1):
            answer = answers.get(str(question_link["question_id"]))
            if answer and (answer.get("answer_json") or {}).get("status") == "marked":
                marked.append(index)
        return marked

    def _clamp_question_number(self, question_number: int, total_questions: int) -> int:
        if total_questions < 1:
            raise ValueError("No questions available")
        return max(1, min(question_number, total_questions))

    def _api_status(self, status: str) -> str:
        return "SUBMITTED" if status == "submitted" else "IN_PROGRESS"

    def _time_taken(self, attempt: dict) -> str:
        started_at = attempt.get("started_at") or attempt.get("created_at")
        submitted_at = attempt.get("submitted_at")
        if not started_at or not submitted_at:
            return "N/A"

        try:
            started = datetime.fromisoformat(str(started_at).replace("Z", "+00:00"))
            submitted = datetime.fromisoformat(str(submitted_at).replace("Z", "+00:00"))
            seconds = max(0, int((submitted - started).total_seconds()))
            minutes, remaining_seconds = divmod(seconds, 60)
            return f"{minutes:02d}:{remaining_seconds:02d}"
        except ValueError:
            return "N/A"

    def _start_mock_attempt(
        self,
        payload: StartAttemptRequest,
        user_id: str,
    ) -> TestAttempt:
        from uuid import uuid4

        attempt_id = str(uuid4())
        attempt = {
            "id": attempt_id,
            "user_id": user_id,
            "test_id": payload.testId,
            "status": "IN_PROGRESS",
            "current_question": 1,
            "answered_count": 0,
        }
        ATTEMPTS[attempt_id] = attempt
        return TestAttempt.model_validate(attempt)

    def _get_mock_attempt(self, attempt_id: str, user_id: str) -> dict:
        attempt = ATTEMPTS.get(attempt_id)
        if not attempt or attempt["user_id"] != user_id:
            raise HTTPException(status_code=404, detail="Attempt not found")
        return attempt

    def _get_mock_questions(
        self,
        attempt_id: str,
        user_id: str,
    ) -> AttemptQuestionsResponse:
        attempt = self._get_mock_attempt(attempt_id, user_id)
        total_questions = 10
        current_number = attempt.get("current_question", 1)

        q_key = (attempt_id, current_number)
        selected_q = MOCK_ATTEMPT_QUESTIONS.get(q_key)

        if not selected_q:
            attempt_answers = [ans for (a_id, q_id), ans in ANSWERS.items() if a_id == attempt_id]
            ans_list = []
            for ans in attempt_answers:
                q_id = ans["question_id"]
                q_num = None
                q_diff = "easy"
                for (a_id, num), q in MOCK_ATTEMPT_QUESTIONS.items():
                    if a_id == attempt_id and q["id"] == q_id:
                        q_num = num
                        q_diff = q["difficulty"]
                        break
                if q_num is not None:
                    is_correct = False
                    q_in_pool = next((qp for qp in MOCK_QUESTIONS_POOL if qp["id"] == q_id), None)
                    if q_in_pool:
                        correct_opt = next((o for o in q_in_pool["options"] if o.get("is_correct")), None)
                        if correct_opt and correct_opt["id"] == ans.get("option_id"):
                            is_correct = True
                    ans_list.append({
                        "question_number": q_num,
                        "difficulty": q_diff,
                        "is_correct": is_correct
                    })
            ans_list.sort(key=lambda x: x["question_number"])

            target_diff = self._determine_target_difficulty(ans_list)

            already_used_ids = [q["id"] for (a_id, num), q in MOCK_ATTEMPT_QUESTIONS.items() if a_id == attempt_id]
            candidates = [qp for qp in MOCK_QUESTIONS_POOL if qp["difficulty"] == target_diff and qp["id"] not in already_used_ids]

            if not candidates:
                fallbacks = ["medium", "easy"] if target_diff == "hard" else (["hard", "easy"] if target_diff == "medium" else ["medium", "hard"])
                for f_diff in fallbacks:
                    candidates = [qp for qp in MOCK_QUESTIONS_POOL if qp["difficulty"] == f_diff and qp["id"] not in already_used_ids]
                    if candidates:
                        target_diff = f_diff
                        break

            if not candidates:
                candidates = [qp for qp in MOCK_QUESTIONS_POOL if qp["id"] not in already_used_ids]

            if not candidates:
                raise ValueError("No unused mock questions available")

            selected_q = candidates[0]
            MOCK_ATTEMPT_QUESTIONS[q_key] = selected_q

        mapped_options = [
            {
                "id": str(opt["id"]),
                "label": opt["option_key"],
                "value": opt["option_text"]
            }
            for opt in selected_q["options"]
        ]

        mapped_q = {
            "id": current_number,
            "points": selected_q["points"],
            "text": selected_q["prompt"],
            "options": mapped_options,
            "answerId": None
        }

        existing_ans = ANSWERS.get((attempt_id, selected_q["id"]))
        if existing_ans:
            mapped_q["answerId"] = existing_ans.get("option_id")

        answered_count = sum(1 for (a_id, q_id), ans in ANSWERS.items() if a_id == attempt_id and ans.get("option_id") is not None)

        return AttemptQuestionsResponse(
            attempt=TestAttempt.model_validate({
                "id": attempt_id,
                "userId": user_id,
                "testId": attempt["test_id"],
                "status": "IN_PROGRESS",
                "currentQuestion": current_number,
                "answeredCount": answered_count
            }),
            question=mapped_q,
            totalQuestions=total_questions,
            markedQuestions=[],
            testTitle="Mock Assessment",
            subjectTitle="General Subject",
            topicTitle="General Topic"
        )

    def _save_mock_answer(
        self,
        attempt_id: str,
        question_id: int,
        payload: SaveAnswerRequest,
        user_id: str,
    ) -> SaveAnswerResponse:
        attempt = self._get_mock_attempt(attempt_id, user_id)

        q_key = (attempt_id, question_id)
        question_obj = MOCK_ATTEMPT_QUESTIONS.get(q_key)
        if not question_obj:
            raise HTTPException(status_code=404, detail="Question not found")

        actual_q_id = question_obj["id"]

        answer = {
            "attempt_id": attempt_id,
            "question_id": actual_q_id,
            "option_id": payload.optionId,
            "status": payload.status,
        }
        ANSWERS[(attempt_id, actual_q_id)] = answer

        answered_count = sum(1 for (a_id, q_id), ans in ANSWERS.items() if a_id == attempt_id and ans.get("option_id") is not None)
        attempt["answered_count"] = answered_count

        if payload.status == "answered":
            attempt["current_question"] = min(question_id + 1, 10)

        return SaveAnswerResponse.model_validate({
            "attemptId": attempt_id,
            "questionId": question_id,
            "optionId": payload.optionId,
            "status": payload.status,
        })


attempt_service = AttemptService()
