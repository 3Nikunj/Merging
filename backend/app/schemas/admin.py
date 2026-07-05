from pydantic import BaseModel, Field


class DashboardOverview(BaseModel):
    subjects: int
    topics: int
    subtopics: int
    tests: int
    questions: int
    coding_problems: int
    latest_attempts: int


class SubjectCreate(BaseModel):
    name: str = Field(min_length=1)
    slug: str = Field(min_length=1)
    sort_order: int = 0
    active: bool = True


class TopicCreate(BaseModel):
    subject_id: str
    name: str = Field(min_length=1)
    slug: str = Field(min_length=1)
    sort_order: int = 0


class SubtopicCreate(BaseModel):
    topic_id: str
    name: str = Field(min_length=1)
    slug: str = Field(min_length=1)
    sort_order: int = 0


class SubjectUpdate(SubjectCreate):
    pass


class TopicUpdate(TopicCreate):
    pass


class SubtopicUpdate(SubtopicCreate):
    pass


class BatchCreate(BaseModel):
    name: str = Field(min_length=1)
    college_id: str | None = None
    college_name: str | None = None
    description: str | None = None
    active: bool = True


class BatchUpdate(BatchCreate):
    pass


class CollegeCreate(BaseModel):
    name: str = Field(min_length=1)
    info: str | None = None
    active: bool = True


class CollegeUpdate(CollegeCreate):
    pass


class TestCreate(BaseModel):
    title: str
    scope: str
    company_id: str | None = None
    subject_id: str | None = None
    topic_id: str | None = None
    duration_minutes: int
    is_active: bool = True
    settings: dict = Field(default_factory=dict)
    created_by: str | None = None


class TestUpdate(TestCreate):
    pass


class TestQuestionCreate(BaseModel):
    test_id: str
    question_id: str
    sort_order: int = 0
    section_label: str | None = None
    marks: float = 1


class TestQuestionUpdate(BaseModel):
    sort_order: int = 0
    section_label: str | None = None
    marks: float = 1


class ProgrammingProblemCreate(BaseModel):
    question_id: str
    slug: str
    active: bool = True
    starter_templates: dict = Field(default_factory=dict)
    constraints_text: str | None = None
    examples_json: list = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    expected_time: str | None = None
    expected_space: str | None = None
    acceptance_rate: float | None = None


class ProgrammingProblemUpdate(ProgrammingProblemCreate):
    pass


class CodingTestCaseCreate(BaseModel):
    input_text: str = Field(min_length=1)
    expected_output: str = Field(min_length=1)
    is_hidden: bool = False
    sort_order: int = 0


class QuestionOptionCreate(BaseModel):
    option_key: str = Field(min_length=1)
    option_text: str = Field(min_length=1)
    is_correct: bool = False
    sort_order: int = 0


class QuestionCreate(BaseModel):
    title: str | None = None
    prompt: str = Field(min_length=1)
    question_type: str = Field(min_length=1)
    subject_id: str | None = None
    topic_id: str | None = None
    subtopic_id: str | None = None
    difficulty: str | None = None
    marks: float = 1
    status: str = "draft"
    metadata: dict = Field(default_factory=dict)
    options: list[QuestionOptionCreate] = Field(default_factory=list)
    coding_test_cases: list[CodingTestCaseCreate] = Field(default_factory=list)


class QuestionUpdate(QuestionCreate):
    pass


class QuestionBulkImport(BaseModel):
    questions: list[QuestionCreate] = Field(min_length=1)


class BatchStudentCreate(BaseModel):
    email: str = Field(min_length=1)
    full_name: str = Field(min_length=1)
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
    roll_number: str | None = None
    status: str = "active"
    temporary_password: str | None = None


class BatchStudentUpdate(BatchStudentCreate):
    pass


class BatchStudentBulkImport(BaseModel):
    students: list[BatchStudentCreate] = Field(min_length=1)
