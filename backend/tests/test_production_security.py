import os
import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import Settings
from app.main import handle_unexpected_exception


def _settings(**overrides: str) -> Settings:
    values = {
        "APP_ENV": "production",
        "FRONTEND_ORIGINS": "https://app.example.com",
        "SUPABASE_URL": "https://project.example.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "service-role-test-value",
        **overrides,
    }
    return Settings(_env_file=None, **values)


class ProductionConfigurationTests(unittest.TestCase):
    def test_frontend_origin_is_required(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ValidationError):
                Settings(
                    _env_file=None,
                    SUPABASE_URL="https://project.example.supabase.co",
                    SUPABASE_SERVICE_ROLE_KEY="service-role-test-value",
                )

    def test_wildcard_origin_is_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            _settings(FRONTEND_ORIGINS="*")

    def test_production_requires_https_origins(self) -> None:
        with self.assertRaises(ValidationError):
            _settings(FRONTEND_ORIGINS="http://app.example.com")

    def test_legacy_single_origin_setting_remains_supported(self) -> None:
        settings = Settings(
            _env_file=None,
            APP_ENV="development",
            FRONTEND_ORIGIN="http://localhost:5173",
            SUPABASE_URL="https://project.example.supabase.co",
            SUPABASE_SERVICE_ROLE_KEY="service-role-test-value",
        )
        self.assertEqual(settings.cors_origins, ("http://localhost:5173",))


class CorsAndExceptionTests(unittest.TestCase):
    def setUp(self) -> None:
        app = FastAPI()
        app.add_exception_handler(Exception, handle_unexpected_exception)
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["https://app.example.com"],
            allow_credentials=False,
            allow_methods=["GET"],
            allow_headers=["Authorization", "Content-Type"],
        )

        @app.get("/ok")
        def ok() -> dict[str, bool]:
            return {"ok": True}

        @app.get("/failure")
        def failure() -> None:
            raise RuntimeError("database-password-must-not-leak")

        self.client = TestClient(app, raise_server_exceptions=False)

    def test_only_configured_origin_receives_cors_header(self) -> None:
        allowed = self.client.get(
            "/ok",
            headers={"Origin": "https://app.example.com"},
        )
        denied = self.client.get(
            "/ok",
            headers={"Origin": "https://evil.example"},
        )

        self.assertEqual(
            allowed.headers.get("access-control-allow-origin"),
            "https://app.example.com",
        )
        self.assertNotIn("access-control-allow-credentials", allowed.headers)
        self.assertNotIn("access-control-allow-origin", denied.headers)

    def test_unexpected_exception_response_is_generic(self) -> None:
        response = self.client.get("/failure")

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"detail": "Internal server error"})
        self.assertNotIn("database-password", response.text)


if __name__ == "__main__":
    unittest.main()
