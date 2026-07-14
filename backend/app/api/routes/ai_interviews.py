from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from typing import Annotated, List

from app.auth.dependency import get_current_user_id, require_role
from app.schemas.ai_interview import (
    AiInterviewSessionCreate,
    AiInterviewSessionResponse,
    AiInterviewAnswerRequest,
    AiInterviewActionResponse,
    AiInterviewReportResponse,
    AiInterviewHistoryItem,
    AiInterviewSummaryResponse
)
from app.services.ai_interview_service import ai_interview_service

router = APIRouter()
AuthenticatedUserId = Annotated[str, Depends(get_current_user_id)]
RoleAuth = [Depends(require_role(["student", "admin"]))]

@router.post("", response_model=AiInterviewSessionResponse, status_code=201, dependencies=RoleAuth)
def create_session(
    payload: AiInterviewSessionCreate,
    current_user_id: AuthenticatedUserId,
) -> AiInterviewSessionResponse:
    return ai_interview_service.create_session(payload, current_user_id)

@router.post("/{session_id}/start", response_model=AiInterviewActionResponse, dependencies=RoleAuth)
def start_session(
    session_id: str,
    current_user_id: AuthenticatedUserId,
) -> AiInterviewActionResponse:
    return ai_interview_service.start_session(session_id, current_user_id)

@router.post("/{session_id}/answer", response_model=AiInterviewActionResponse, dependencies=RoleAuth)
def submit_answer(
    session_id: str,
    payload: AiInterviewAnswerRequest,
    current_user_id: AuthenticatedUserId,
) -> AiInterviewActionResponse:
    return ai_interview_service.submit_answer(session_id, payload.model_dump(), current_user_id)

@router.post("/{session_id}/skip", response_model=AiInterviewActionResponse, dependencies=RoleAuth)
def skip_question(
    session_id: str,
    current_user_id: AuthenticatedUserId,
) -> AiInterviewActionResponse:
    return ai_interview_service.skip_question(session_id, current_user_id)

@router.post("/{session_id}/complete", response_model=AiInterviewActionResponse, dependencies=RoleAuth)
def complete_session(
    session_id: str,
    current_user_id: AuthenticatedUserId,
) -> AiInterviewActionResponse:
    return ai_interview_service.complete_session(session_id, current_user_id)

@router.get("/history", response_model=List[AiInterviewHistoryItem], dependencies=RoleAuth)
def get_history(
    current_user_id: AuthenticatedUserId,
) -> List[AiInterviewHistoryItem]:
    return ai_interview_service.get_history(current_user_id)

@router.get("/summary", response_model=AiInterviewSummaryResponse, dependencies=RoleAuth)
def get_summary(
    current_user_id: AuthenticatedUserId,
) -> AiInterviewSummaryResponse:
    return ai_interview_service.get_summary(current_user_id)

@router.get("/{session_id}/report", response_model=AiInterviewReportResponse, dependencies=RoleAuth)
def get_report(
    session_id: str,
    current_user_id: AuthenticatedUserId,
) -> AiInterviewReportResponse:
    return ai_interview_service.get_report(session_id, current_user_id)

@router.get("/{session_id}/tts")
async def stream_tts(
    session_id: str,
    text: str,
):
    session = ai_interview_service._get_session_by_id_public(session_id)
    voice_accent = session.get("voice_accent", "af_heart")
    return StreamingResponse(
        ai_interview_service.generate_speech(text, voice_accent),
        media_type="audio/mpeg"
    )
