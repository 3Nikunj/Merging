from functools import lru_cache

from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache
def get_supabase_client() -> Client | None:
    settings = get_settings()

    if not settings.supabase_enabled:
        return None

    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_supabase_admin() -> Client:
    client = get_supabase_client()
    if not client:
        raise ValueError("Supabase URL and Service Role Key must be set for Admin access.")
    return client

