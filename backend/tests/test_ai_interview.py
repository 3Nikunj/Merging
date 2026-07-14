import sys
from unittest.mock import MagicMock

# 1. Mock require_role in app.auth.dependency before loading app.main
import app.auth.dependency as auth_dep

def dummy_require_role(allowed_roles):
    def dependency():
        user = MagicMock()
        user.id = "test-student-uuid"
        return user
    return dependency

auth_dep.require_role = dummy_require_role

# 2. Mock the supabase client module before importing app.main
mock_supabase_client = MagicMock()
mock_supabase_module = MagicMock()
mock_supabase_module.get_supabase_client.return_value = mock_supabase_client
mock_supabase_module.get_supabase_admin.return_value = mock_supabase_client
sys.modules["app.core.supabase"] = mock_supabase_module

import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from datetime import datetime, timezone

from app.core.config import Settings

def _mock_settings():
    return Settings(
        _env_file=None,
        APP_ENV="development",
        FRONTEND_ORIGIN="http://localhost:5173",
        SUPABASE_URL="https://mock.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY="mock-service-role-key",
    )

# Patch config settings and import app.main
with patch("app.core.config.get_settings", return_value=_mock_settings()):
    from app.main import app
    from app.services.ai_interview_service import ai_interview_service

class TestAiInterviewEndpoints(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)
        self.student_id = "test-student-uuid"
        
        # Reset mock calls on mock client before each test
        mock_supabase_client.reset_mock()
        
        # Override get_current_user_id and get_current_user dependencies
        app.dependency_overrides[auth_dep.get_current_user] = lambda: MagicMock(id=self.student_id)
        app.dependency_overrides[auth_dep.get_current_user_id] = lambda: self.student_id

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    def test_create_session(self) -> None:
        # Mock successful insert
        mock_insert_response = MagicMock()
        mock_insert_response.data = [{
            "id": "mock-session-id",
            "student_id": self.student_id,
            "mode": "custom",
            "company": "Google",
            "position": "Software Engineer",
            "experience_level": "Mid-Level",
            "interview_type": "Technical",
            "difficulty": "Intermediate",
            "status": "setup",
            "overall_score": None,
            "started_at": None,
            "completed_at": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }]
        
        mock_supabase_client.table("ai_interview_sessions").insert().execute.return_value = mock_insert_response

        payload = {
            "mode": "custom",
            "company": "Google",
            "position": "Software Engineer",
            "experienceLevel": "Mid-Level",
            "interviewType": "Technical",
            "difficulty": "Intermediate"
        }
        response = self.client.post("/api/ai-interviews", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["id"], "mock-session-id")
        self.assertEqual(data["mode"], "custom")

    def test_start_session(self) -> None:
        # Mock fetch session details
        mock_session_resp = MagicMock()
        mock_session_resp.data = [{
            "id": "mock-session-id",
            "student_id": self.student_id,
            "mode": "custom",
            "company": "Google",
            "position": "Software Engineer",
            "experience_level": "Mid-Level",
            "interview_type": "Technical",
            "difficulty": "Intermediate",
            "status": "setup",
            "overall_score": None,
            "started_at": None,
            "completed_at": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }]
        mock_supabase_client.table("ai_interview_sessions").select().eq().eq().limit().execute.return_value = mock_session_resp
        
        # Mock turns insertion
        mock_turn_resp = MagicMock()
        mock_turn_resp.data = [{"id": "mock-turn-id"}]
        mock_supabase_client.table("ai_interview_turns").insert().execute.return_value = mock_turn_resp

        # Patch Groq API key as None to fall back to mock
        with patch.object(ai_interview_service, "_get_api_key", return_value=None):
            response = self.client.post("/api/ai-interviews/mock-session-id/start")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["status"], "active")
            self.assertIn("walk me through", data["interviewerMessage"].lower())

    def test_submit_answer(self) -> None:
        # Mock active session
        mock_session_resp = MagicMock()
        mock_session_resp.data = [{
            "id": "mock-session-id",
            "student_id": self.student_id,
            "mode": "custom",
            "company": "Google",
            "position": "Software Engineer",
            "experience_level": "Mid-Level",
            "interview_type": "Technical",
            "difficulty": "Intermediate",
            "status": "active",
            "overall_score": None,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }]
        
        # Mock current turns
        mock_turns_resp = MagicMock()
        mock_turns_resp.data = [{
            "id": "mock-turn-id",
            "session_id": "mock-session-id",
            "sort_order": 1,
            "question": "Tell me about yourself.",
            "answer_transcript": None,
            "score": None,
            "rubric_json": {},
            "mistakes_json": [],
            "missing_keywords_json": []
        }]

        # Define table queries mock returns
        mock_supabase_client.table("ai_interview_sessions").select().eq().eq().limit().execute.return_value = mock_session_resp
        mock_supabase_client.table("ai_interview_turns").select().eq().order().execute.return_value = mock_turns_resp

        # Patch API key as None to trigger fallback mock evaluation
        with patch.object(ai_interview_service, "_get_api_key", return_value=None):
            payload = {"answerTranscript": "I am a web developer with 3 years of React experience."}
            response = self.client.post("/api/ai-interviews/mock-session-id/answer", json=payload)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["status"], "active")
            self.assertIsNotNone(data["score"])
            self.assertIsNotNone(data["rubric"])

    def test_get_report(self) -> None:
        # Mock session details
        mock_session_resp = MagicMock()
        mock_session_resp.data = [{
            "id": "mock-session-id",
            "student_id": self.student_id,
            "mode": "custom",
            "company": "Google",
            "position": "Software Engineer",
            "experience_level": "Mid-Level",
            "interview_type": "Technical",
            "difficulty": "Intermediate",
            "status": "completed",
            "overall_score": 75,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }]
        
        # Mock report details
        mock_report_resp = MagicMock()
        mock_report_resp.data = [{
            "session_id": "mock-session-id",
            "summary": "Overall good trial.",
            "strengths_json": ["Communication"],
            "weaknesses_json": ["Specific metrics"],
            "recommended_practice_json": [],
            "dashboard_metrics_json": {}
        }]
        
        # Mock turns list
        mock_turns_resp = MagicMock()
        mock_turns_resp.data = [{
            "id": "mock-turn-id",
            "session_id": "mock-session-id",
            "sort_order": 1,
            "question": "Tell me about yourself.",
            "question_type": "Technical",
            "answer_transcript": "I am a dev.",
            "score": 75,
            "rubric_json": {},
            "mistakes_json": [],
            "missing_keywords_json": [],
            "corrected_answer": "STAR formatted response...",
            "feedback": "Actionable feedback.",
            "follow_up_needed": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }]

        # Match table requests
        mock_supabase_client.table("ai_interview_sessions").select().eq().eq().limit().execute.return_value = mock_session_resp
        mock_supabase_client.table("ai_interview_reports").select().eq().limit().execute.return_value = mock_report_resp
        mock_supabase_client.table("ai_interview_turns").select().eq().order().execute.return_value = mock_turns_resp

        response = self.client.get("/api/ai-interviews/mock-session-id/report")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["overallScore"], 75)
        self.assertEqual(len(data["turns"]), 1)

if __name__ == "__main__":
    unittest.main()
