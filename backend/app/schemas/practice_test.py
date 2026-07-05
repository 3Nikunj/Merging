from typing import Literal

from pydantic import BaseModel, Field

Difficulty = Literal["Easy", "Medium", "Hard"]
TestStatus = Literal["Not Started", "In Progress", "Completed"]


class PracticeTest(BaseModel):
    id: str
    title: str
    category: str
    status: TestStatus
    questions: int
    duration: int
    difficulty: Difficulty
    is_premium: bool = Field(default=False, serialization_alias="isPremium")


class SelectionItem(BaseModel):
    id: str
    title: str
    progress: int
    average: str
    questions: int
    badge: str | None = None


class TestSummary(BaseModel):
    subject: str
    topic: str
    subtopic: str
    title: str
    questions: int
    duration: int
    total_marks: int = Field(serialization_alias="totalMarks")
    difficulty: Difficulty
    passing_score: str = Field(serialization_alias="passingScore")
    attempts_allowed: int = Field(serialization_alias="attemptsAllowed")
    best_score: str = Field(serialization_alias="bestScore")


class PracticeTestsResponse(BaseModel):
    tests: list[PracticeTest]


class SelectionDataResponse(BaseModel):
    subjects: list[SelectionItem]
    topics: list[SelectionItem]
    subtopics: list[SelectionItem]
    selected_test: TestSummary = Field(serialization_alias="selectedTest")
