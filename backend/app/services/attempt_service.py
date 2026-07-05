from datetime import datetime, timezone
from uuid import UUID

from postgrest.exceptions import APIError

from app.core.supabase import get_supabase_client
from app.schemas.analytics import AnswerReviewRow, AttemptResult, ResultBreakdown
from app.schemas.attempt import (
    AttemptQuestionsResponse,
    SaveAnswerRequest,
    SaveAnswerResponse,
    StartAttemptRequest,
    SubmitAttemptResponse,
    TestAttempt,
)
from app.services.mock_data import ANSWER_REVIEW, LIVE_QUESTION, RESULT_BREAKDOWN, SELECTED_TEST


ATTEMPTS: dict[str, dict] = {}
ANSWERS: dict[tuple[str, int], dict] = {}


class AttemptService:
    def start_attempt(self, payload: StartAttemptRequest) -> TestAttempt:
        client = get_supabase_client()

        if client:
            try:
                test_id = self._resolve_test_id(payload.testId)
                user_id = self._resolve_user_id(payload.userId)
                response = (
                    client.table("test_attempts")
                    .insert(
                        {
                            "user_id": user_id,
                            "test_id": test_id,
                            "status": "in_progress",
                        }
                    )
                    .execute()
                )
                row = response.data[0]
                return TestAttempt.model_validate(self._map_attempt(row, answered_count=0))
            except (APIError, IndexError, ValueError):
                pass

        return self._start_mock_attempt(payload)

    def get_questions(self, attempt_id: str, question_number: int | None = None) -> AttemptQuestionsResponse:
        client = get_supabase_client()

        if client:
            try:
                attempt = self._get_attempt(attempt_id)
                ordered_questions = self._get_ordered_test_questions(attempt["test_id"])
                if not ordered_questions:
                    raise ValueError("Test has no questions")

                answers = self._get_attempt_answers(attempt_id)
                answered_count = self._answered_count(answers)
                current_number = self._clamp_question_number(
                    question_number or min(answered_count + 1, len(ordered_questions)),
                    len(ordered_questions),
                )
                question_link = ordered_questions[current_number - 1]
                question = self._get_question(question_link["question_id"])
                options = self._get_options(question_link["question_id"])
                answer = answers.get(str(question_link["question_id"]))

                return AttemptQuestionsResponse(
                    attempt=TestAttempt.model_validate(
                        self._map_attempt(
                            attempt,
                            current_question=current_number,
                            answered_count=answered_count,
                        )
                    ),
                    question=self._map_question(current_number, question_link, question, options, answer),
                    total_questions=len(ordered_questions),
                    marked_questions=self._marked_numbers(ordered_questions, answers),
                )
            except (APIError, IndexError, ValueError):
                pass

        return self._get_mock_questions(attempt_id)

    def save_answer(
        self,
        attempt_id: str,
        question_id: int,
        payload: SaveAnswerRequest,
    ) -> SaveAnswerResponse:
        client = get_supabase_client()

        if client:
            try:
                attempt = self._get_attempt(attempt_id)
                ordered_questions = self._get_ordered_test_questions(attempt["test_id"])
                question_number = self._clamp_question_number(question_id, len(ordered_questions))
                question_link = ordered_questions[question_number - 1]
                actual_question_id = str(question_link["question_id"])
                selected_option = self._get_option(payload.optionId) if payload.optionId else None
                score = float(question_link.get("marks") or 1) if selected_option and selected_option.get("is_correct") else 0
                answer_json = {"status": payload.status, "questionNumber": question_number}

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
                        "question_id": question_number,
                        "option_id": row.get("selected_option_id"),
                        "status": payload.status,
                    }
                )
            except (APIError, IndexError, ValueError):
                pass

        return self._save_mock_answer(attempt_id, question_id, payload)

    def submit_attempt(self, attempt_id: str) -> SubmitAttemptResponse:
        client = get_supabase_client()

        if client:
            try:
                result = self._calculate_result(attempt_id)
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
                    .execute()
                )
                return SubmitAttemptResponse(
                    attempt_id=attempt_id,
                    status="SUBMITTED",
                    result_url=f"/practice-tests/results?attemptId={attempt_id}",
                )
            except (APIError, ValueError):
                pass

        if attempt_id in ATTEMPTS:
            ATTEMPTS[attempt_id]["status"] = "SUBMITTED"

        return SubmitAttemptResponse(
            attempt_id=attempt_id,
            status="SUBMITTED",
            result_url=f"/practice-tests/results?attemptId={attempt_id}",
        )

    def get_result(self, attempt_id: str) -> AttemptResult:
        client = get_supabase_client()

        if client:
            try:
                return self._calculate_result(attempt_id)
            except (APIError, ValueError):
                pass

        return AttemptResult(
            attempt_id=attempt_id,
            title=SELECTED_TEST["title"],
            overall_score=78,
            correct=24,
            incorrect=4,
            skipped=2,
            time_taken="38:15",
            percentile="92nd",
            breakdown=RESULT_BREAKDOWN,
            answer_review=ANSWER_REVIEW,
        )

    def _resolve_test_id(self, requested_test_id: str) -> str:
        try:
            UUID(requested_test_id)
            return requested_test_id
        except ValueError:
            pass

        client = get_supabase_client()
        if not client:
            raise ValueError("Supabase client unavailable")

        rows = client.table("tests").select("id").order("created_at").limit(1).execute().data or []
        if not rows:
            raise ValueError("No tests available")
        return rows[0]["id"]

    def _resolve_user_id(self, requested_user_id: str) -> str:
        try:
            UUID(requested_user_id)
            return requested_user_id
        except ValueError:
            pass

        client = get_supabase_client()
        if not client:
            raise ValueError("Supabase client unavailable")

        rows = client.table("profiles").select("id").limit(1).execute().data or []
        if not rows:
            raise ValueError("No profiles available for demo attempt")
        return rows[0]["id"]

    def _get_attempt(self, attempt_id: str) -> dict:
        client = get_supabase_client()
        if not client:
            raise ValueError("Supabase client unavailable")

        rows = client.table("test_attempts").select("*").eq("id", attempt_id).limit(1).execute().data or []
        if not rows:
            raise ValueError("Attempt not found")
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

    def _calculate_result(self, attempt_id: str) -> AttemptResult:
        attempt = self._get_attempt(attempt_id)
        test = self._get_test(attempt["test_id"])
        ordered_questions = self._get_ordered_test_questions(attempt["test_id"])
        answers = self._get_attempt_answers(attempt_id)

        correct = 0
        incorrect = 0
        skipped = 0
        review_rows: list[AnswerReviewRow] = []

        for index, question_link in enumerate(ordered_questions, start=1):
            question_id = str(question_link["question_id"])
            answer = answers.get(question_id)
            question = self._get_question(question_id)

            if not answer or not answer.get("selected_option_id"):
                skipped += 1
                status = "Skipped"
            elif answer.get("is_correct"):
                correct += 1
                status = "Correct"
            else:
                incorrect += 1
                status = "Incorrect"

            review_rows.append(
                AnswerReviewRow(
                    id=str(index).zfill(2),
                    preview=(question.get("prompt") or "")[:80],
                    status=status,
                    topic=test.get("title", "Practice Test"),
                )
            )

        total_questions = max(len(ordered_questions), 1)
        overall_score = round((correct / total_questions) * 100)

        return AttemptResult(
            attempt_id=attempt_id,
            title=test.get("title", "Practice Test"),
            overall_score=overall_score,
            correct=correct,
            incorrect=incorrect,
            skipped=skipped,
            time_taken=self._time_taken(attempt),
            percentile="N/A",
            breakdown=[
                ResultBreakdown(label="Correct", score=correct),
                ResultBreakdown(label="Incorrect", score=incorrect),
                ResultBreakdown(label="Skipped", score=skipped),
            ],
            answer_review=review_rows,
        )

    def _get_test(self, test_id: str) -> dict:
        client = get_supabase_client()
        if not client:
            raise ValueError("Supabase client unavailable")

        rows = client.table("tests").select("id,title").eq("id", test_id).limit(1).execute().data or []
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

    def _start_mock_attempt(self, payload: StartAttemptRequest) -> TestAttempt:
        from uuid import uuid4

        attempt_id = str(uuid4())
        attempt = {
            "id": attempt_id,
            "user_id": payload.userId,
            "test_id": payload.testId,
            "status": "IN_PROGRESS",
            "current_question": 12,
            "answered_count": 11,
        }
        ATTEMPTS[attempt_id] = attempt
        return TestAttempt.model_validate(attempt)

    def _get_mock_questions(self, attempt_id: str) -> AttemptQuestionsResponse:
        attempt = ATTEMPTS.get(
            attempt_id,
            {
                "id": attempt_id,
                "user_id": "demo-user",
                "test_id": "prime-factors",
                "status": "IN_PROGRESS",
                "current_question": 12,
                "answered_count": 12,
            },
        )

        return AttemptQuestionsResponse(
            attempt=TestAttempt.model_validate(attempt),
            question=LIVE_QUESTION,
            total_questions=SELECTED_TEST["questions"],
            marked_questions=[15, 22],
        )

    def _save_mock_answer(
        self,
        attempt_id: str,
        question_id: int,
        payload: SaveAnswerRequest,
    ) -> SaveAnswerResponse:
        answer = {
            "attempt_id": attempt_id,
            "question_id": question_id,
            "option_id": payload.optionId,
            "status": payload.status,
        }
        ANSWERS[(attempt_id, question_id)] = answer

        if attempt_id in ATTEMPTS and payload.status == "answered":
            ATTEMPTS[attempt_id]["answered_count"] = max(
                ATTEMPTS[attempt_id]["answered_count"],
                question_id,
            )

        return SaveAnswerResponse.model_validate(answer)


attempt_service = AttemptService()
