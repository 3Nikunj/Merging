"""coding.py — REST endpoints for code execution and submission."""
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from app.core.supabase import get_supabase_client
from app.services.code_executor_service import run_code, submit_code

router = APIRouter()


class RunCodeRequest(BaseModel):
    problemId: str
    code: str


class SubmitCodeRequest(BaseModel):
    problemId: str
    code: str
    userId: str


@router.post("/run")
def execute_code(body: RunCodeRequest) -> dict:
    """
    Run user-submitted Python code against hidden test cases.
    Returns status, stdout, stderr, testsPassed, totalTests.
    Does NOT persist to the database.
    """
    return run_code(problem_id=body.problemId, user_code=body.code)


@router.post("/submit")
def submit_solution(body: SubmitCodeRequest) -> dict:
    """
    Run code, then persist the submission to coding_submissions table.
    Returns execution result + submissionId from the database.
    """
    if not body.userId:
        raise HTTPException(status_code=400, detail="userId is required")
    return submit_code(
        problem_id=body.problemId,
        user_code=body.code,
        user_id=body.userId,
    )


@router.get("/submissions/{user_id}")
def list_submissions(user_id: str, problem_id: str | None = None) -> dict:
    """
    Fetch the submission history for a given user.
    Optionally filter by problem_id.
    """
    client = get_supabase_client()
    if not client:
        return {"submissions": []}

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
        raise HTTPException(status_code=500, detail=str(exc))
