from typing import Literal

from pydantic import BaseModel, Field

AttemptStatus = Literal["IN_PROGRESS", "SUBMITTED"]
AnswerStatus = Literal["answered", "marked", "not_answered"]


class StartAttemptRequest(BaseModel):
    userId: str
    testId: str
    subjectId: str | None = None
    topicId: str | None = None
    subtopicId: str | None = None


class TestAttempt(BaseModel):
    id: str
    user_id: str = Field(serialization_alias="userId")
    test_id: str = Field(serialization_alias="testId")
    status: AttemptStatus
    current_question: int = Field(serialization_alias="currentQuestion")
    answered_count: int = Field(serialization_alias="answeredCount")


class QuestionOption(BaseModel):
    id: str
    label: str
    value: str


class LiveQuestion(BaseModel):
    id: int
    points: int
    text: str
    options: list[QuestionOption]
    answer_id: str | None = Field(default=None, serialization_alias="answerId")


class AttemptQuestionsResponse(BaseModel):
    attempt: TestAttempt
    question: LiveQuestion
    total_questions: int = Field(serialization_alias="totalQuestions")
    marked_questions: list[int] = Field(serialization_alias="markedQuestions")


class SaveAnswerRequest(BaseModel):
    optionId: str | None = None
    status: AnswerStatus = "answered"


class SaveAnswerResponse(BaseModel):
    attempt_id: str = Field(serialization_alias="attemptId")
    question_id: int = Field(serialization_alias="questionId")
    option_id: str | None = Field(serialization_alias="optionId")
    status: AnswerStatus


class SubmitAttemptResponse(BaseModel):
    attempt_id: str = Field(serialization_alias="attemptId")
    status: AttemptStatus
    result_url: str = Field(serialization_alias="resultUrl")
