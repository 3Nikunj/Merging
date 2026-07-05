from pydantic import ValidationError
from postgrest.exceptions import APIError

from app.core.supabase import get_supabase_client
from app.schemas.practice_test import (
    PracticeTest,
    PracticeTestsResponse,
    SelectionDataResponse,
    SelectionItem,
    TestSummary,
)
from app.services.mock_data import PRACTICE_TESTS, SELECTED_TEST, SUBJECTS, SUBTOPICS, TOPICS


class PracticeTestService:
    def list_practice_tests(self) -> PracticeTestsResponse:
        client = get_supabase_client()

        if client:
            try:
                tests = (
                    client.table("tests")
                    .select("id,title,duration_minutes,is_active,settings,created_at")
                    .eq("is_active", True)
                    .order("created_at")
                    .execute()
                    .data
                    or []
                )
                question_counts = self._test_question_counts()

                if tests:
                    return PracticeTestsResponse(
                        tests=[
                            PracticeTest.model_validate(self._map_test(row, question_counts))
                            for row in tests
                        ]
                    )
            except (APIError, ValidationError):
                pass

        return PracticeTestsResponse(
            tests=[PracticeTest.model_validate(test) for test in PRACTICE_TESTS]
        )

    def get_selection_data(self) -> SelectionDataResponse:
        client = get_supabase_client()

        if client:
            try:
                subjects = client.table("subjects").select("*").order("sort_order").execute().data or []
                topics = client.table("topics").select("*").order("sort_order").execute().data or []
                subtopics = client.table("subtopics").select("*").order("sort_order").execute().data or []
                tests = (
                    client.table("tests")
                    .select("id,title,subject_id,topic_id,duration_minutes,settings,created_at")
                    .eq("is_active", True)
                    .order("created_at")
                    .execute()
                    .data
                    or []
                )
                question_counts = self._test_question_counts()
                subject_counts, topic_counts = self._hierarchy_counts(tests, question_counts)

                if subjects and topics and subtopics:
                    return SelectionDataResponse(
                        subjects=[
                            SelectionItem.model_validate(
                                self._map_selection_item(item, subject_counts.get(str(item["id"]), 0))
                            )
                            for item in subjects
                        ],
                        topics=[
                            SelectionItem.model_validate(
                                self._map_selection_item(item, topic_counts.get(str(item["id"]), 0))
                            )
                            for item in topics
                        ],
                        subtopics=[
                            SelectionItem.model_validate(self._map_selection_item(item, 0))
                            for item in subtopics
                        ],
                        selected_test=TestSummary.model_validate(
                            self._map_summary(tests[0], subjects, topics, subtopics, question_counts)
                            if tests
                            else SELECTED_TEST
                        ),
                    )
            except (APIError, ValidationError):
                pass

        return SelectionDataResponse(
            subjects=[SelectionItem.model_validate(item) for item in SUBJECTS],
            topics=[SelectionItem.model_validate(item) for item in TOPICS],
            subtopics=[SelectionItem.model_validate(item) for item in SUBTOPICS],
            selected_test=TestSummary.model_validate(SELECTED_TEST),
        )

    def _test_question_counts(self) -> dict[str, int]:
        client = get_supabase_client()
        if not client:
            return {}

        rows = client.table("test_questions").select("test_id").execute().data or []
        counts: dict[str, int] = {}
        for row in rows:
            test_id = str(row["test_id"])
            counts[test_id] = counts.get(test_id, 0) + 1
        return counts

    def _hierarchy_counts(
        self,
        tests: list[dict],
        question_counts: dict[str, int],
    ) -> tuple[dict[str, int], dict[str, int]]:
        subject_counts: dict[str, int] = {}
        topic_counts: dict[str, int] = {}

        for test in tests:
            count = question_counts.get(str(test["id"]), 0)
            subject_id = test.get("subject_id")
            topic_id = test.get("topic_id")

            if subject_id:
                key = str(subject_id)
                subject_counts[key] = subject_counts.get(key, 0) + count

            if topic_id:
                key = str(topic_id)
                topic_counts[key] = topic_counts.get(key, 0) + count

        return subject_counts, topic_counts

    def _map_test(self, row: dict, question_counts: dict[str, int]) -> dict:
        settings = row.get("settings") or {}
        difficulty = self._difficulty(settings.get("difficulty"))
        question_count = question_counts.get(str(row["id"]), settings.get("questions", 0))

        return {
            "id": str(row["id"]),
            "title": row["title"],
            "category": settings.get("category", "Practice Test"),
            "status": "Not Started" if row.get("is_active", True) else "Completed",
            "questions": question_count,
            "duration": row.get("duration_minutes") or settings.get("duration", 0),
            "difficulty": difficulty,
            "is_premium": settings.get("is_premium", False),
        }

    def _map_selection_item(self, row: dict, question_count: int) -> dict:
        return {
            "id": str(row["id"]),
            "title": row.get("title") or row.get("name") or row.get("slug") or str(row["id"]),
            "progress": row.get("progress", 0),
            "average": row.get("average", "N/A"),
            "questions": question_count,
            "badge": row.get("badge"),
        }

    def _map_summary(
        self,
        test: dict,
        subjects: list[dict],
        topics: list[dict],
        subtopics: list[dict],
        question_counts: dict[str, int],
    ) -> dict:
        settings = test.get("settings") or {}
        subject = self._find_name(subjects, test.get("subject_id"), "Practice")
        topic = self._find_name(topics, test.get("topic_id"), "General")
        subtopic = self._first_name(subtopics, "Mixed Practice")
        question_count = question_counts.get(str(test["id"]), settings.get("questions", 0))

        return {
            "subject": subject,
            "topic": topic,
            "subtopic": subtopic,
            "title": test["title"],
            "questions": question_count,
            "duration": test.get("duration_minutes") or 0,
            "total_marks": question_count,
            "difficulty": self._difficulty(settings.get("difficulty")),
            "passing_score": settings.get("passing_score", "40%"),
            "attempts_allowed": settings.get("attempts_allowed", 3),
            "best_score": settings.get("best_score", "N/A"),
        }

    def _difficulty(self, value: str | None) -> str:
        return value if value in {"Easy", "Medium", "Hard"} else "Medium"

    def _find_name(self, rows: list[dict], row_id: str | None, fallback: str) -> str:
        for row in rows:
            if str(row.get("id")) == str(row_id):
                return row.get("title") or row.get("name") or row.get("slug") or fallback
        return fallback

    def _first_name(self, rows: list[dict], fallback: str) -> str:
        if not rows:
            return fallback

        row = rows[0]
        return row.get("title") or row.get("name") or row.get("slug") or fallback


practice_test_service = PracticeTestService()
