from typing import Any
from app.repositories.base import BaseAttemptRepository
from app.core.supabase import get_supabase_client

class SupabaseAttemptRepository(BaseAttemptRepository):
    def get_client(self) -> Any:
        return get_supabase_client()

    def get_test_by_id(self, test_id: str) -> dict | None:
        client = self.get_client()
        res = client.table("tests").select("id,subject_id,topic_id").eq("id", test_id).limit(1).execute().data
        return res[0] if res else None

    def check_published_questions_exist(self, subject_id: str, topic_id: str) -> bool:
        client = self.get_client()
        res = (
            client.table("questions")
            .select("id")
            .eq("subject_id", subject_id)
            .eq("topic_id", topic_id)
            .eq("status", "published")
            .limit(1)
            .execute()
        )
        return bool(res.data)

    def create_attempt(self, user_id: str, test_id: str) -> dict:
        client = self.get_client()
        res = (
            client.table("test_attempts")
            .insert({
                "user_id": user_id,
                "test_id": test_id,
                "status": "in_progress",
            })
            .execute()
        )
        return res.data[0]
