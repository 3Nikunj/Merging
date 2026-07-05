from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from app.core.supabase import get_supabase_client

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    client = get_supabase_client()
    if not client:
        # Fallback for local development when Supabase is disabled
        return {"id": "demo-user", "email": "student@aivalytics.com"}
        
    try:
        user_res = client.auth.get_user(token)
        user = user_res.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid session token")
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

def require_role(allowed_roles: list[str]):
    def dependency(user = Depends(get_current_user)):
        # If fallback user
        if isinstance(user, dict) and user.get("id") == "demo-user":
            return user
            
        client = get_supabase_client()
        if not client:
            return user
            
        try:
            profile_res = client.table("profiles").select("role").eq("id", user.id).limit(1).execute()
            if not profile_res.data:
                raise HTTPException(status_code=403, detail="User profile not found in database")
            role = profile_res.data[0]["role"]
            if role not in allowed_roles:
                raise HTTPException(status_code=403, detail="Forbidden: Access is denied")
            return user
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Role verification failed: {str(e)}")
            
    return dependency
