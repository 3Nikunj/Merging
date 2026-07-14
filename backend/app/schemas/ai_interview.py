from pydantic import BaseModel, Field
from typing import Literal, Optional, List, Dict, Any
from datetime import datetime

class AiInterviewSessionCreate(BaseModel):
    mode: Literal["jd_based", "custom"]
    company: Optional[str] = None
    position: Optional[str] = None
    experience_level: Optional[str] = None
    interview_type: Optional[str] = None
    difficulty: Optional[str] = None
    jd_text: Optional[str] = None
    resume_text: Optional[str] = None
    voice_accent: Optional[str] = Field(default="af_heart", alias="voiceAccent")

    model_config = {
        "populate_by_name": True
    }

class AiInterviewSessionResponse(BaseModel):
    id: str
    student_id: str = Field(alias="studentId")
    mode: str
    company: Optional[str] = None
    position: Optional[str] = None
    experience_level: Optional[str] = Field(default=None, alias="experienceLevel")
    interview_type: Optional[str] = Field(default=None, alias="interviewType")
    difficulty: Optional[str] = None
    status: str
    voice_accent: Optional[str] = Field(default="af_heart", alias="voiceAccent")
    overall_score: Optional[float] = Field(default=None, alias="overallScore")
    started_at: Optional[datetime] = Field(default=None, alias="startedAt")
    completed_at: Optional[datetime] = Field(default=None, alias="completedAt")
    created_at: datetime = Field(alias="createdAt")

    model_config = {
        "populate_by_name": True,
        "from_attributes": True
    }

class AiInterviewAnswerRequest(BaseModel):
    answer_transcript: str = Field(alias="answerTranscript", min_length=1)

class AiInterviewActionResponse(BaseModel):
    status: str # "active" | "completed"
    interviewer_message: str = Field(alias="interviewerMessage")
    question_type: Optional[str] = Field(default=None, alias="questionType")
    score: Optional[float] = None
    feedback: Optional[str] = None
    rubric: Optional[Dict[str, float]] = None
    mistakes: Optional[List[str]] = None
    missing_keywords: Optional[List[str]] = Field(default=None, alias="missingKeywords")
    corrected_answer: Optional[str] = Field(default=None, alias="correctedAnswer")
    follow_up_needed: bool = Field(default=False, alias="followUpNeeded")

    model_config = {
        "populate_by_name": True
    }

class AiInterviewTurnDetail(BaseModel):
    id: str
    sort_order: int = Field(alias="sortOrder")
    question: str
    question_type: Optional[str] = Field(default=None, alias="questionType")
    answer_transcript: Optional[str] = Field(default=None, alias="answerTranscript")
    score: Optional[float] = None
    rubric: Dict[str, float]
    mistakes: List[str]
    missing_keywords: List[str] = Field(alias="missingKeywords")
    corrected_answer: Optional[str] = Field(default=None, alias="correctedAnswer")
    feedback: Optional[str] = None
    follow_up_needed: bool = Field(alias="followUpNeeded")
    created_at: datetime = Field(alias="createdAt")

    model_config = {
        "populate_by_name": True
    }

class AiInterviewReportResponse(BaseModel):
    session_id: str = Field(alias="sessionId")
    summary: Optional[str] = None
    strengths: List[str]
    weaknesses: List[str]
    recommended_practice: List[Dict[str, Any]] = Field(alias="recommendedPractice")
    dashboard_metrics: Dict[str, Any] = Field(alias="dashboardMetrics")
    turns: List[AiInterviewTurnDetail]
    overall_score: Optional[float] = Field(default=None, alias="overallScore")

    model_config = {
        "populate_by_name": True
    }

class AiInterviewHistoryItem(BaseModel):
    id: str
    mode: str
    company: Optional[str] = None
    position: Optional[str] = None
    interview_type: Optional[str] = Field(default=None, alias="interviewType")
    difficulty: Optional[str] = None
    status: str
    overall_score: Optional[float] = Field(default=None, alias="overallScore")
    created_at: datetime = Field(alias="createdAt")

    model_config = {
        "populate_by_name": True
    }

class AiInterviewSummaryResponse(BaseModel):
    average_score: float = Field(alias="averageScore")
    total_completed: int = Field(alias="totalCompleted")
    weakest_area: str = Field(alias="weakestArea")
    strongest_area: str = Field(alias="strongestArea")
    recent_scores: List[Dict[str, Any]] = Field(alias="recentScores")

    model_config = {
        "populate_by_name": True
    }
