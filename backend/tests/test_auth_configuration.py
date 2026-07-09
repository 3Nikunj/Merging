import os
import unittest
from unittest.mock import patch

from pydantic import ValidationError

from app.core.config import Settings
from app.core.supabase import get_supabase_client


class AuthenticationConfigurationTests(unittest.TestCase):
    def tearDown(self) -> None:
        get_supabase_client.cache_clear()

    def test_missing_authentication_configuration_is_rejected(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ValidationError) as raised:
                Settings(_env_file=None)

        missing_fields = {".".join(map(str, error["loc"])) for error in raised.exception.errors()}
        self.assertIn("SUPABASE_URL", missing_fields)
        self.assertIn("SUPABASE_SERVICE_ROLE_KEY", missing_fields)

    @patch("app.core.supabase.create_client")
    @patch("app.core.supabase.get_settings")
    def test_supabase_client_is_created_only_from_required_settings(
        self,
        settings_mock,
        create_client_mock,
    ) -> None:
        settings_mock.return_value = Settings(
            _env_file=None,
            APP_ENV="development",
            FRONTEND_ORIGINS="http://localhost:5173",
            SUPABASE_URL="https://project.example.supabase.co",
            SUPABASE_SERVICE_ROLE_KEY="service-role-test-value",
        )
        expected_client = object()
        create_client_mock.return_value = expected_client

        client = get_supabase_client()

        self.assertIs(client, expected_client)
        create_client_mock.assert_called_once_with(
            "https://project.example.supabase.co",
            "service-role-test-value",
        )


if __name__ == "__main__":
    unittest.main()
