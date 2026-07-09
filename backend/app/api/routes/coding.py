"""REST endpoints for code execution and submission."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.dependency import get_current_user_id
from app.core.supabase import get_supabase_client
from app.services.code_executor_service import run_code, submit_code

router = APIRouter()
AuthenticatedUserId = Annotated[str, Depends(get_current_user_id)]


class RunCodeRequest(BaseModel):
    problemId: str = Field(min_length=1, max_length=128)
    code: str = Field(min_length=1, max_length=65_536)


class SubmitCodeRequest(BaseModel):
    problemId: str = Field(min_length=1, max_length=128)
    code: str = Field(min_length=1, max_length=65_536)
    # Accepted for backward compatibility only. Ownership comes from the JWT.
    userId: str | None = None


@router.post("/run")
def execute_code(body: RunCodeRequest) -> dict:
    """Run submitted Python code without persisting it."""
    return run_code(problem_id=body.problemId, user_code=body.code)


@router.post("/submit")
def submit_solution(
    body: SubmitCodeRequest,
    current_user_id: AuthenticatedUserId,
) -> dict:
    """Run and persist code for the authenticated user."""
    return submit_code(
        problem_id=body.problemId,
        user_code=body.code,
        user_id=current_user_id,
    )


def _list_submissions(user_id: str, problem_id: str | None) -> dict:
    """Fetch submission history scoped to one verified user ID."""
    client = get_supabase_client()
    if not client:
        raise HTTPException(
            status_code=503,
            detail="Submission service is unavailable",
        )

    try:
        query = (
            client.table("coding_submissions")
            .select("*")
            .eq("user_id", user_id)
            .order("submitted_at", desc=True)
            .limit(50)
        )
        if problem_id:
            query = query.eq("problem_id", problem_id)

        rows = query.execute().data or []
        return {"submissions": rows}
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve submissions",
        ) from exc


@router.get("/submissions")
def list_current_user_submissions(
    current_user_id: AuthenticatedUserId,
    problem_id: str | None = None,
) -> dict:
    """Fetch submission history for the authenticated user."""
    return _list_submissions(current_user_id, problem_id)


@router.get("/submissions/{user_id}")
def list_submissions(
    user_id: str,
    current_user_id: AuthenticatedUserId,
    problem_id: str | None = None,
) -> dict:
    """Support the legacy URL without permitting cross-user access."""
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return _list_submissions(current_user_id, problem_id)
