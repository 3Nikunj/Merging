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


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str | None = None
    phone: str | None = None
    college: str | None = None
    department: str | None = None
    year_of_graduation: int | None = None
    bio: str | None = None
    github_url: str | None = None
    linkedin_url: str | None = None
    skills: str | None = None
    avatar_url: str | None = None
    membership_type: str | None = None


class UserAcademics(BaseModel):
    tenth_percentage: float | None = None
    twelfth_percentage: float | None = None
    graduation_cgpa: float | None = None
    backlogs: int = 0
    gap_years: int = 0
    gap_during_grad: bool = False


class UserProfileResponse(BaseModel):
    profile: UserProfile
    academics: UserAcademics | None = None


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    college: str | None = None
    department: str | None = None
    year_of_graduation: int | None = None
    tenth_percentage: float | None = None
    twelfth_percentage: float | None = None
    graduation_cgpa: float | None = None
    backlogs: int = 0
    gap_years: int = 0
    gap_during_grad: bool = False
    bio: str | None = None
    github_url: str | None = None
    linkedin_url: str | None = None
    skills: str | None = None
    avatar_url: str | None = None
    membership_type: str | None = None


class DashboardStatsResponse(BaseModel):
    average_test_score: float = Field(serialization_alias="averageTestScore")
    tests_completed: int = Field(serialization_alias="testsCompleted")
    coding_success_rate: float = Field(serialization_alias="codingSuccessRate")
    coding_total_submissions: int = Field(serialization_alias="codingTotalSubmissions")
    interview_average_score: float = Field(serialization_alias="interviewAverageScore")
    interview_completed_count: int = Field(serialization_alias="interviewCompletedCount")
    subject_mastery: dict[str, float] = Field(default={}, serialization_alias="subjectMastery")

