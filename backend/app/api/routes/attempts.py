from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth.dependency import get_current_user_id
from app.schemas.analytics import AttemptResult
from app.schemas.attempt import (
    AttemptQuestionsResponse,
    SaveAnswerRequest,
    SaveAnswerResponse,
    StartAttemptRequest,
    SubmitAttemptResponse,
    TestAttempt,
)
from app.services.attempt_service import attempt_service

router = APIRouter()
AuthenticatedUserId = Annotated[str, Depends(get_current_user_id)]


@router.post("", response_model=TestAttempt, status_code=201)
def start_attempt(
    payload: StartAttemptRequest,
    current_user_id: AuthenticatedUserId,
) -> TestAttempt:
    return attempt_service.start_attempt(payload, current_user_id)


@router.get("/{attempt_id}/questions", response_model=AttemptQuestionsResponse)
def get_attempt_questions(
    attempt_id: str,
    current_user_id: AuthenticatedUserId,
    question_number: int | None = None,
) -> AttemptQuestionsResponse:
    return attempt_service.get_questions(
        attempt_id,
        current_user_id,
        question_number,
    )


@router.patch("/{attempt_id}/answers/{question_id}", response_model=SaveAnswerResponse)
def save_answer(
    attempt_id: str,
    question_id: int,
    payload: SaveAnswerRequest,
    current_user_id: AuthenticatedUserId,
) -> SaveAnswerResponse:
    return attempt_service.save_answer(
        attempt_id,
        question_id,
        payload,
        current_user_id,
    )


@router.post("/{attempt_id}/submit", response_model=SubmitAttemptResponse)
def submit_attempt(
    attempt_id: str,
    current_user_id: AuthenticatedUserId,
) -> SubmitAttemptResponse:
    return attempt_service.submit_attempt(attempt_id, current_user_id)


@router.get("/{attempt_id}/result", response_model=AttemptResult)
def get_result(
    attempt_id: str,
    current_user_id: AuthenticatedUserId,
) -> AttemptResult:
    return attempt_service.get_result(attempt_id, current_user_id)
