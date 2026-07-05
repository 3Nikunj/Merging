from typing import Literal

from pydantic import BaseModel, Field

ReviewStatus = Literal["Correct", "Incorrect", "Skipped"]


class ResultBreakdown(BaseModel):
    label: str
    score: int


class AnswerReviewRow(BaseModel):
    id: str
    preview: str
    status: ReviewStatus
    topic: str


class AttemptResult(BaseModel):
    attempt_id: str = Field(serialization_alias="attemptId")
    title: str
    overall_score: int = Field(serialization_alias="overallScore")
    correct: int
    incorrect: int
    skipped: int
    time_taken: str = Field(serialization_alias="timeTaken")
    percentile: str
    breakdown: list[ResultBreakdown]
    answer_review: list[AnswerReviewRow] = Field(serialization_alias="answerReview")


class Recommendation(BaseModel):
    label: str
    title: str
    description: str


class WeakArea(BaseModel):
    topic: str
    accuracy: int


class RecommendationsResponse(BaseModel):
    recommendations: list[Recommendation]


class WeakAreasResponse(BaseModel):
    weak_areas: list[WeakArea] = Field(serialization_alias="weakAreas")
