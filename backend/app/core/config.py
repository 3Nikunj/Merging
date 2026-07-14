from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit

from pydantic import AliasChoices, Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]
BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_env: Literal["development", "staging", "production"] = Field(
        default="production",
        alias="APP_ENV",
    )
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")
    frontend_origins: str = Field(
        min_length=1,
        validation_alias=AliasChoices("FRONTEND_ORIGINS", "FRONTEND_ORIGIN"),
        serialization_alias="FRONTEND_ORIGINS",
    )
    supabase_url: str = Field(min_length=1, alias="SUPABASE_URL")
    supabase_service_role_key: SecretStr = Field(
        min_length=1,
        alias="SUPABASE_SERVICE_ROLE_KEY",
    )
    groq_api_key: SecretStr | None = Field(default=None, alias="GROQ_API_KEY")
    database_url: str | None = Field(default=None, alias="DATABASE_URL")
    sandbox_executor_url: str | None = Field(
        default=None,
        alias="SANDBOX_EXECUTOR_URL",
    )
    sandbox_executor_token: SecretStr | None = Field(
        default=None,
        alias="SANDBOX_EXECUTOR_TOKEN",
    )
    sandbox_timeout_seconds: float = Field(
        default=2.0,
        ge=0.5,
        le=10.0,
        alias="SANDBOX_TIMEOUT_SECONDS",
    )

    model_config = SettingsConfigDict(
        env_file=(PROJECT_ROOT / ".env", BACKEND_ROOT / ".env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    @model_validator(mode="after")
    def validate_frontend_origins(self) -> "Settings":
        origins = self.cors_origins
        if not origins:
            raise ValueError("At least one frontend origin must be configured")

        for origin in origins:
            parsed = urlsplit(origin)
            if (
                origin == "*"
                or parsed.scheme not in {"http", "https"}
                or not parsed.netloc
                or parsed.username is not None
                or parsed.password is not None
                or parsed.path
                or parsed.query
                or parsed.fragment
            ):
                raise ValueError(
                    "Frontend origins must be exact HTTP(S) origins without "
                    "paths, credentials, queries, fragments, or wildcards"
                )
            if self.app_env != "development" and parsed.scheme != "https":
                raise ValueError(
                    "Staging and production frontend origins must use HTTPS"
                )
        return self

    @property
    def cors_origins(self) -> tuple[str, ...]:
        """Return a stable, de-duplicated CORS origin allowlist."""
        return tuple(
            dict.fromkeys(
                origin.strip().rstrip("/")
                for origin in self.frontend_origins.split(",")
                if origin.strip()
            )
        )

@lru_cache
def get_settings() -> Settings:
    return Settings()
