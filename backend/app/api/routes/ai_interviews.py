from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from typing import Annotated, List
import json
import logging
import asyncio
from app.core.supabase import get_supabase_client

logger = logging.getLogger(__name__)

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



async def evaluate_and_save_turn(session: dict, turns: list[dict], turn_id: str, answer_text: str):
    try:
        api_key = ai_interview_service._get_api_key()
        if not api_key:
            eval_data = ai_interview_service._get_mock_turn_evaluation(turns[-1]["question"], answer_text)
        else:
            eval_data = ai_interview_service._evaluate_turn_llm(session, turns, answer_text)

        def get_val(d, keys, default):
            for k in keys:
                if k in d and d[k] is not None:
                    return d[k]
            return default

        score = get_val(eval_data, ["score", "overall_score", "overallScore"], 70.0)
        rubric = get_val(eval_data, ["rubric", "rubric_scores", "rubricScores"], {})
        mistakes = get_val(eval_data, ["mistakes", "mistake_list"], [])
        missing_keywords = get_val(eval_data, ["missing_keywords", "missingKeywords"], [])
        corrected_answer = get_val(eval_data, ["corrected_answer", "correctedAnswer"], "")
        feedback = get_val(eval_data, ["feedback", "verbal_feedback"], "")
        follow_up_needed = get_val(eval_data, ["follow_up_needed", "followUpNeeded"], False)

        ai_interview_service.client.table("ai_interview_turns").update({
            "answer_transcript": answer_text,
            "score": score,
            "rubric_json": rubric,
            "mistakes_json": mistakes,
            "missing_keywords_json": missing_keywords,
            "corrected_answer": corrected_answer,
            "feedback": feedback,
            "follow_up_needed": follow_up_needed
        }).eq("id", turn_id).execute()
        logger.info(f"Successfully evaluated and updated turn {turn_id}")
    except Exception as e:
        logger.error(f"Error evaluating turn {turn_id} in background: {e}")

@router.websocket("/ws/{session_id}")
async def ws_interview(
    websocket: WebSocket,
    session_id: str,
    token: str | None = None
):
    await websocket.accept()
    
    # Authenticate token via Supabase
    client = get_supabase_client()
    try:
        user_res = client.auth.get_user(token)
        user = user_res.user
        if not user:
            await websocket.close(code=4001, reason="Invalid token")
            return
        student_id = str(user.id)
    except Exception as e:
        logger.error(f"WebSocket auth failed: {e}")
        await websocket.close(code=4001, reason="Authentication failed")
        return

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")
            
            if msg_type == "start":
                session = ai_interview_service._get_session_by_id(session_id, student_id)
                await websocket.send_json({
                    "type": "session_info",
                    "voice_accent": session.get("voice_accent", "af_heart")
                })
                turns_res = ai_interview_service.client.table("ai_interview_turns").select("*").eq("session_id", session_id).order("sort_order").execute()
                turns = turns_res.data or []
                
                if turns:
                    active_q = turns[-1]["question"]
                    await websocket.send_json({
                        "type": "question",
                        "text": active_q
                    })
                else:
                    await websocket.send_json({"type": "status", "status": "thinking"})
                    
                    prompt = (
                        f"Set context: Role Description: {session['position']} at {session['company']} ({session['experience_level']} Level).\n"
                        f"Difficulty: {session['difficulty']}.\n"
                        f"Interview Type: {session['interview_type']}.\n"
                        f"Job Description: {session.get('jd_text', '') or 'None'}\n"
                        f"Candidate Resume: {session.get('resume_text', '') or 'None'}\n\n"
                        "Generate the first verbal question of this interview. It must feel realistic, tailored, and match the difficulty level.\n"
                        "Output ONLY the question text itself. Do not wrap it in JSON. Output nothing else."
                    )
                    messages = [{"role": "user", "content": prompt}]
                    
                    full_q = ""
                    async for token_chunk in ai_interview_service._call_groq_stream(messages):
                        full_q += token_chunk
                        await websocket.send_json({
                            "type": "text_delta",
                            "text": token_chunk
                        })
                    
                    next_turn_row = {
                        "session_id": session_id,
                        "sort_order": 1,
                        "question": full_q,
                        "question_type": session["interview_type"],
                        "rubric_json": {},
                        "mistakes_json": [],
                        "missing_keywords_json": []
                    }
                    ai_interview_service.client.table("ai_interview_turns").insert(next_turn_row).execute()
                    ai_interview_service.client.table("ai_interview_sessions").update({"status": "active"}).eq("id", session_id).execute()
                    
                    await websocket.send_json({
                        "type": "question",
                        "text": full_q
                    })
                    
            elif msg_type == "answer":
                answer_text = message.get("text", "").strip()
                if not answer_text:
                    await websocket.send_json({"type": "error", "message": "Answer text is empty"})
                    continue
                
                session = ai_interview_service._get_session_by_id(session_id, student_id)
                turns_res = ai_interview_service.client.table("ai_interview_turns").select("*").eq("session_id", session_id).order("sort_order").execute()
                turns = turns_res.data or []
                current_turn = turns[-1]
                
                await websocket.send_json({"type": "status", "status": "thinking"})
                
                # Run evaluation and database save in background
                asyncio.create_task(evaluate_and_save_turn(session, turns, current_turn["id"], answer_text))
                
                max_turns = 5
                if len(turns) < max_turns:
                    history_context = ""
                    for idx, t in enumerate(turns):
                        history_context += f"Q{idx+1}: {t['question']}\n"
                        if idx < len(turns) - 1:
                            history_context += f"A{idx+1}: {t['answer_transcript']}\n"
                    history_context += f"A{len(turns)}: {answer_text}\n"
                    
                    prompt = (
                        f"Set context: Role Description: {session['position']} at {session['company']} ({session['experience_level']} Level).\n"
                        f"Difficulty: {session['difficulty']}.\n"
                        f"Interview Type: {session['interview_type']}.\n"
                        f"Job Description: {session.get('jd_text', '') or 'None'}\n"
                        f"Candidate Resume: {session.get('resume_text', '') or 'None'}\n\n"
                        f"Conversation History:\n{history_context}\n"
                        "Act as the Technical HR interviewer. Based on the candidate's last answer, decide if a brief follow-up question is needed, or move to the next topic question.\n"
                        "Generate ONLY the next question text itself. Do not wrap it in JSON. Output nothing else."
                    )
                    messages = [{"role": "user", "content": prompt}]
                    
                    full_q = ""
                    async for token_chunk in ai_interview_service._call_groq_stream(messages):
                        full_q += token_chunk
                        await websocket.send_json({
                            "type": "text_delta",
                            "text": token_chunk
                        })
                    
                    next_sort_order = current_turn["sort_order"] + 1
                    next_turn_row = {
                        "session_id": session_id,
                        "sort_order": next_sort_order,
                        "question": full_q,
                        "question_type": session["interview_type"],
                        "rubric_json": {},
                        "mistakes_json": [],
                        "missing_keywords_json": []
                    }
                    ai_interview_service.client.table("ai_interview_turns").insert(next_turn_row).execute()
                    
                    await websocket.send_json({
                        "type": "question",
                        "text": full_q
                    })
                else:
                    ai_interview_service.complete_session(session_id, student_id)
                    await websocket.send_json({
                        "type": "complete",
                        "message": "Interview completed successfully"
                    })
                    
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected from session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
