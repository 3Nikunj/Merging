from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from gotrue.types import User

from app.core.supabase import get_supabase_client

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> User:
    token = credentials.credentials
    client = get_supabase_client()

    try:
        user_res = client.auth.get_user(token)
        user = user_res.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid session token")
        return user
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=401,
            detail="Authentication failed",
        ) from exc


def get_current_user_id(user: User = Depends(get_current_user)) -> str:
    """Return the immutable user ID from a Supabase-verified access token."""
    return str(user.id)


def require_role(allowed_roles: list[str]):
    def dependency(user: User = Depends(get_current_user)) -> User:
        client = get_supabase_client()

        try:
            profile_res = client.table("profiles").select("role").eq("id", user.id).limit(1).execute()
            if not profile_res.data:
                raise HTTPException(status_code=403, detail="User profile not found in database")
            role = profile_res.data[0]["role"]
            if role not in allowed_roles:
                raise HTTPException(status_code=403, detail="Forbidden: Access is denied")
            return user
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail="Role verification failed",
            ) from exc
            
    return dependency
