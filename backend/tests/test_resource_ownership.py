import unittest
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.api.routes.coding import (
    SubmitCodeRequest,
    list_submissions,
    submit_solution,
)
from app.api.routes.recommendations import get_recommendations, get_weak_areas
from app.auth.dependency import get_current_user
from app.schemas.attempt import StartAttemptRequest
from app.services.attempt_service import ATTEMPTS, attempt_service


class ClientSuppliedIdentityTests(unittest.TestCase):
    def setUp(self) -> None:
        ATTEMPTS.clear()

    @patch("app.api.routes.coding.submit_code")
    def test_code_submission_ignores_body_user_id(self, submit_code_mock) -> None:
        submit_code_mock.return_value = {"submissionId": "submission-id"}
        body = SubmitCodeRequest(
            problemId="problem-id",
            code="print('safe')",
            userId="attacker-selected-user",
        )

        submit_solution(body, current_user_id="authenticated-user")

        submit_code_mock.assert_called_once_with(
            problem_id="problem-id",
            user_code="print('safe')",
            user_id="authenticated-user",
        )

    def test_legacy_submission_history_rejects_foreign_user(self) -> None:
        with self.assertRaises(HTTPException) as raised:
            list_submissions(
                user_id="foreign-user",
                current_user_id="authenticated-user",
            )

        self.assertEqual(raised.exception.status_code, 403)

    def test_legacy_analytics_routes_reject_foreign_user(self) -> None:
        for endpoint in (get_recommendations, get_weak_areas):
            with self.subTest(endpoint=endpoint.__name__):
                with self.assertRaises(HTTPException) as raised:
                    endpoint(
                        user_id="foreign-user",
                        current_user_id="authenticated-user",
                    )
                self.assertEqual(raised.exception.status_code, 403)

    @patch("app.services.attempt_service.get_supabase_client", return_value=None)
    def test_attempt_owner_comes_from_authenticated_user(self, _client_mock) -> None:
        payload = StartAttemptRequest(
            userId="attacker-selected-user",
            testId="test-id",
        )

        attempt = attempt_service.start_attempt(payload, "authenticated-user")

        self.assertEqual(attempt.user_id, "authenticated-user")

    @patch("app.services.attempt_service.get_supabase_client", return_value=None)
    def test_foreign_attempt_is_not_accessible(self, _client_mock) -> None:
        payload = StartAttemptRequest(testId="test-id")
        attempt = attempt_service.start_attempt(payload, "owner-user")

        with self.assertRaises(HTTPException) as raised:
            attempt_service.get_questions(attempt.id, "foreign-user")

        self.assertEqual(raised.exception.status_code, 404)

    @patch("app.auth.dependency.get_supabase_client")
    def test_authentication_rejects_verification_failure(self, client_mock) -> None:
        client_mock.return_value.auth.get_user.side_effect = RuntimeError(
            "verification unavailable"
        )
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="unverified-token",
        )

        with self.assertRaises(HTTPException) as raised:
            get_current_user(credentials)

        self.assertEqual(raised.exception.status_code, 401)
        self.assertEqual(raised.exception.detail, "Authentication failed")


if __name__ == "__main__":
    unittest.main()
