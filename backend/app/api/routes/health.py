from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter()


@router.get("/health")
def health_check() -> dict[str, str | bool]:
    settings = get_settings()

    return {
        "status": "ok",
        "environment": settings.app_env,
        "supabaseEnabled": settings.supabase_enabled,
    }
