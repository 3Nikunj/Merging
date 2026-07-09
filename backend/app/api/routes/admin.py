import secrets
import string
from collections.abc import Iterable

from fastapi import APIRouter, Depends, HTTPException
from postgrest.exceptions import APIError

from app.core.supabase import get_supabase_admin
from app.auth.dependency import require_role
from app.schemas.admin import (
    BatchCreate,
    BatchStudentBulkImport,
    BatchStudentCreate,
    BatchStudentUpdate,
    BatchUpdate,
    CollegeCreate,
    CollegeUpdate,
    DashboardOverview,
    QuestionBulkImport,
    QuestionCreate,
    QuestionUpdate,
    ProgrammingProblemCreate,
    ProgrammingProblemUpdate,
    SubjectCreate,
    SubjectUpdate,
    SubtopicCreate,
    SubtopicUpdate,
    TestCreate,
    TestQuestionCreate,
    TestQuestionUpdate,
    TestUpdate,
    TopicCreate,
    TopicUpdate,
)

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_role(["admin"]))]
)

BATCH_MIGRATION_MESSAGE = "Batches need the latest Supabase migration before this action can run."
QUESTION_TYPES = {"mcq", "coding"}
QUESTION_STATUSES = {"draft", "review", "published", "archived"}


def _table_count(client, table: str) -> int:
    response = client.table(table).select("*", count="exact", head=True).execute()
    return response.count or 0


def _normalize_question_type(question_type: str) -> str:
    normalized = question_type.strip().lower()
    if normalized not in QUESTION_TYPES:
        raise HTTPException(status_code=400, detail="Question type must be mcq or coding")
    return normalized


def _normalize_question_status(status: str) -> str:
    normalized = status.strip().lower()
    if normalized == "active":
        normalized = "published"
    if normalized not in QUESTION_STATUSES:
        raise HTTPException(status_code=400, detail="Question status must be draft, review, published, or archived")
    return normalized


def _validate_question_payload(payload: QuestionCreate) -> None:
    question_type = _normalize_question_type(payload.question_type)

    if question_type == "mcq":
        if len(payload.options) < 2:
            raise HTTPException(status_code=400, detail="MCQ questions need at least two options")
        if not any(option.is_correct for option in payload.options):
            raise HTTPException(status_code=400, detail="MCQ questions need at least one correct option")
    elif question_type == "coding" and not payload.coding_test_cases:
        raise HTTPException(status_code=400, detail="Coding questions need at least one test case")


def _canonical_question_data(client, payload: QuestionCreate) -> dict:
    data = payload.model_dump(exclude={"options", "coding_test_cases"})
    data["question_type"] = _normalize_question_type(payload.question_type)
    data["status"] = _normalize_question_status(payload.status)

    subject_id = payload.subject_id
    topic_id = payload.topic_id
    subtopic_id = payload.subtopic_id

    if subtopic_id:
        subtopic = _fetch_single(client, "subtopics", subtopic_id)
        parent_topic = _fetch_single(client, "topics", subtopic["topic_id"])
        if topic_id and topic_id != subtopic["topic_id"]:
            raise HTTPException(status_code=400, detail="Subtopic does not belong to the selected topic")
        if subject_id and subject_id != parent_topic["subject_id"]:
            raise HTTPException(status_code=400, detail="Subtopic does not belong to the selected subject")
        topic_id = subtopic["topic_id"]
        subject_id = parent_topic["subject_id"]
    elif topic_id:
        topic = _fetch_single(client, "topics", topic_id)
        if subject_id and subject_id != topic["subject_id"]:
            raise HTTPException(status_code=400, detail="Topic does not belong to the selected subject")
        subject_id = topic["subject_id"]
    elif subject_id:
        _fetch_single(client, "subjects", subject_id)

    if data["status"] == "published" and not (subject_id and topic_id and subtopic_id):
        raise HTTPException(status_code=400, detail="Published questions need subject, topic, and subtopic")

    data["subject_id"] = subject_id
    data["topic_id"] = topic_id
    data["subtopic_id"] = subtopic_id
    return data


def _create_question_record(client, payload: QuestionCreate):
    _validate_question_payload(payload)
    question_data = _canonical_question_data(client, payload)

    question_response = client.table("questions").insert(question_data).execute()
    question = question_response.data[0]

    if question_data["question_type"] == "mcq" and payload.options:
        options_payload = [
            {
                "question_id": question["id"],
                "option_key": option.option_key,
                "option_text": option.option_text,
                "is_correct": option.is_correct,
                "sort_order": option.sort_order,
            }
            for option in payload.options
        ]
        client.table("question_options").insert(options_payload).execute()
    elif question_data["question_type"] == "coding" and payload.coding_test_cases:
        test_case_payload = [
            {
                "question_id": question["id"],
                "input_text": test_case.input_text,
                "expected_output": test_case.expected_output,
                "is_hidden": test_case.is_hidden,
                "sort_order": test_case.sort_order,
            }
            for test_case in payload.coding_test_cases
        ]
        client.table("coding_test_cases").insert(test_case_payload).execute()

    full_question = (
        client.table("questions")
        .select("*, subjects(name), topics(name, subject_id), subtopics(name, topic_id), question_options(*), coding_test_cases(*)")
        .eq("id", question["id"])
        .limit(1)
        .execute()
    )
    return full_question.data[0]


def _validate_question_taxonomy(client, payload: QuestionCreate) -> None:
    _canonical_question_data(client, payload)


def _question_taxonomy_issues(question: dict) -> list[str]:
    issues: list[str] = []
    status = _normalize_question_status(str(question.get("status") or "draft"))
    subject_id = question.get("subject_id")
    topic_id = question.get("topic_id")
    subtopic_id = question.get("subtopic_id")
    topic = question.get("topics") or {}
    subtopic = question.get("subtopics") or {}
    options = question.get("question_options") or []
    test_cases = question.get("coding_test_cases") or []
    question_type = str(question.get("question_type") or "").lower()

    if status == "published" and not (subject_id and topic_id and subtopic_id):
        issues.append("Published question is missing a complete taxonomy path")
    if topic_id and subject_id and topic.get("subject_id") and topic["subject_id"] != subject_id:
        issues.append("Topic does not belong to the selected subject")
    if subtopic_id and topic_id and subtopic.get("topic_id") and subtopic["topic_id"] != topic_id:
        issues.append("Subtopic does not belong to the selected topic")
    if question_type == "mcq":
        if len(options) < 2:
            issues.append("MCQ has fewer than two options")
        if not any(option.get("is_correct") for option in options):
            issues.append("MCQ has no correct answer")
    if question_type == "coding" and not test_cases:
        issues.append("Coding question has no judge test cases")
    return issues


def _ensure_question_matches_test(client, payload: TestQuestionCreate) -> None:
    test = _fetch_single(client, "tests", payload.test_id)
    question = _fetch_single(client, "questions", payload.question_id)
    question_status = _normalize_question_status(str(question.get("status") or "draft"))

    if question_status == "archived":
        raise HTTPException(status_code=400, detail="Archived questions cannot be attached to tests")
    if test.get("is_active") and question_status != "published":
        raise HTTPException(status_code=400, detail="Active tests can only use published questions")
    if test.get("topic_id") and question.get("topic_id") != test["topic_id"]:
        raise HTTPException(status_code=400, detail="Question topic does not match the selected test topic")
    if test.get("subject_id") and question.get("subject_id") != test["subject_id"]:
        raise HTTPException(status_code=400, detail="Question subject does not match the selected test subject")


def _fetch_single(client, table: str, row_id: str):
    response = client.table(table).select("*").eq("id", row_id).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail=f"{table[:-1].capitalize()} not found")
    return response.data[0]


def _generate_password() -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(12))


def _normalize_student_status(status: str) -> str:
    normalized = status.strip().lower()
    return normalized if normalized in {"active", "inactive"} else "active"


def _raise_batch_api_error(exc: APIError) -> None:
    if "schema cache" in str(exc) and any(table in str(exc) for table in ("colleges", "batches", "batch_users")):
        raise HTTPException(status_code=400, detail=BATCH_MIGRATION_MESSAGE) from exc
    raise exc


def _get_or_create_college(client, name: str):
    normalized_name = name.strip()
    if not normalized_name:
        raise HTTPException(status_code=400, detail="College name is required")

    response = client.table("colleges").select("*").ilike("name", normalized_name).limit(1).execute()
    if response.data:
        return response.data[0]

    created = client.table("colleges").insert({"name": normalized_name}).execute()
    return created.data[0]


def _resolve_batch_college_id(client, payload: BatchCreate) -> str:
    if payload.college_id:
        _fetch_single(client, "colleges", payload.college_id)
        return payload.college_id
    if payload.college_name:
        return _get_or_create_college(client, payload.college_name)["id"]
    raise HTTPException(status_code=400, detail="College name is required")


def _batch_counts(client):
    batches = client.table("batches").select("id,college_id").execute().data or []
    memberships = client.table("batch_users").select("batch_id").execute().data or []
    batch_count_by_college: dict[str, int] = {}
    student_count_by_batch: dict[str, int] = {}

    for batch in batches:
        college_id = batch.get("college_id")
        if college_id:
            batch_count_by_college[college_id] = batch_count_by_college.get(college_id, 0) + 1
    for membership in memberships:
        batch_id = membership["batch_id"]
        student_count_by_batch[batch_id] = student_count_by_batch.get(batch_id, 0) + 1

    return batch_count_by_college, student_count_by_batch


def _get_profile_by_email(client, email: str):
    response = client.table("profiles").select("*").eq("email", email.lower()).limit(1).execute()
    return response.data[0] if response.data else None


def _create_auth_user(client, payload: BatchStudentCreate) -> str:
    password = payload.temporary_password or _generate_password()
    try:
        response = client.auth.admin.create_user(
            {
                "email": payload.email.lower(),
                "password": password,
                "email_confirm": True,
                "user_metadata": {"full_name": payload.full_name},
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not create Supabase auth user for {payload.email}. The email may already exist.",
        ) from exc

    user = getattr(response, "user", None)
    user_id = getattr(user, "id", None)
    if not user_id:
        raise HTTPException(status_code=400, detail=f"Could not create Supabase auth user for {payload.email}")
    return user_id


def _upsert_batch_student(client, batch_id: str, payload: BatchStudentCreate):
    batch = _fetch_single(client, "batches", batch_id)
    college_name = None
    if batch.get("college_id"):
        college = _fetch_single(client, "colleges", batch["college_id"])
        college_name = college.get("name")

    email = payload.email.strip().lower()
    existing_profile = _get_profile_by_email(client, email)
    profile_id = existing_profile["id"] if existing_profile else _create_auth_user(client, payload)

    profile_data = {
        "id": profile_id,
        "email": email,
        "full_name": payload.full_name,
        "role": "student",
        "phone": payload.phone,
        "college": payload.college or college_name,
        "department": payload.department,
        "year_of_graduation": payload.year_of_graduation,
    }
    client.table("profiles").upsert(profile_data).execute()

    academic_data = {
        "profile_id": profile_id,
        "tenth_percentage": payload.tenth_percentage,
        "twelfth_percentage": payload.twelfth_percentage,
        "graduation_cgpa": payload.graduation_cgpa,
        "backlogs": payload.backlogs,
        "gap_years": payload.gap_years,
        "gap_during_grad": payload.gap_during_grad,
    }
    client.table("profile_academics").upsert(academic_data).execute()

    membership_data = {
        "batch_id": batch_id,
        "profile_id": profile_id,
        "roll_number": payload.roll_number,
        "status": _normalize_student_status(payload.status),
    }
    client.table("batch_users").upsert(membership_data).execute()

    return _get_batch_student(client, batch_id, profile_id)


def _get_batch_student(client, batch_id: str, profile_id: str):
    membership_response = (
        client.table("batch_users")
        .select("*")
        .eq("batch_id", batch_id)
        .eq("profile_id", profile_id)
        .limit(1)
        .execute()
    )
    if not membership_response.data:
        raise HTTPException(status_code=404, detail="Student is not in this batch")

    profile_response = client.table("profiles").select("*").eq("id", profile_id).limit(1).execute()
    academics_response = client.table("profile_academics").select("*").eq("profile_id", profile_id).limit(1).execute()
    membership = membership_response.data[0]
    profile = profile_response.data[0] if profile_response.data else {}
    academics = academics_response.data[0] if academics_response.data else {}

    return {
        **membership,
        "profile": profile,
        "academics": academics,
    }


@router.get("/overview", response_model=DashboardOverview)
def get_overview() -> DashboardOverview:
    client = get_supabase_admin()
    return DashboardOverview(
        subjects=_table_count(client, "subjects"),
        topics=_table_count(client, "topics"),
        subtopics=_table_count(client, "subtopics"),
        tests=_table_count(client, "tests"),
        questions=_table_count(client, "questions"),
        coding_problems=_table_count(client, "programming_problems"),
        latest_attempts=_table_count(client, "test_attempts"),
    )


@router.get("/subjects")
def list_subjects():
    client = get_supabase_admin()
    response = client.table("subjects").select("*").order("sort_order").execute()
    return {"items": response.data}


@router.post("/subjects")
def create_subject(payload: SubjectCreate):
    client = get_supabase_admin()
    response = client.table("subjects").insert(payload.model_dump()).execute()
    return {"item": response.data[0]}


@router.put("/subjects/{subject_id}")
def update_subject(subject_id: str, payload: SubjectUpdate):
    client = get_supabase_admin()
    _fetch_single(client, "subjects", subject_id)
    response = client.table("subjects").update(payload.model_dump()).eq("id", subject_id).execute()
    return {"item": response.data[0]}


@router.delete("/subjects/{subject_id}")
def delete_subject(subject_id: str):
    client = get_supabase_admin()
    _fetch_single(client, "subjects", subject_id)
    client.table("subjects").delete().eq("id", subject_id).execute()
    return {"deleted": True}


@router.get("/topics")
def list_topics(subject_id: str | None = None):
    client = get_supabase_admin()
    query = client.table("topics").select("*, subjects(name)")
    if subject_id:
        query = query.eq("subject_id", subject_id)
    response = query.order("sort_order").execute()
    return {"items": response.data}


@router.post("/topics")
def create_topic(payload: TopicCreate):
    client = get_supabase_admin()
    response = client.table("topics").insert(payload.model_dump()).execute()
    return {"item": response.data[0]}


@router.put("/topics/{topic_id}")
def update_topic(topic_id: str, payload: TopicUpdate):
    client = get_supabase_admin()
    _fetch_single(client, "topics", topic_id)
    response = client.table("topics").update(payload.model_dump()).eq("id", topic_id).execute()
    return {"item": response.data[0]}


@router.delete("/topics/{topic_id}")
def delete_topic(topic_id: str):
    client = get_supabase_admin()
    _fetch_single(client, "topics", topic_id)
    client.table("topics").delete().eq("id", topic_id).execute()
    return {"deleted": True}


@router.get("/subtopics")
def list_subtopics(topic_id: str | None = None):
    client = get_supabase_admin()
    query = client.table("subtopics").select("*, topics(name, subject_id)")
    if topic_id:
        query = query.eq("topic_id", topic_id)
    response = query.order("sort_order").execute()
    return {"items": response.data}


@router.post("/subtopics")
def create_subtopic(payload: SubtopicCreate):
    client = get_supabase_admin()
    response = client.table("subtopics").insert(payload.model_dump()).execute()
    return {"item": response.data[0]}


@router.put("/subtopics/{subtopic_id}")
def update_subtopic(subtopic_id: str, payload: SubtopicUpdate):
    client = get_supabase_admin()
    _fetch_single(client, "subtopics", subtopic_id)
    response = client.table("subtopics").update(payload.model_dump()).eq("id", subtopic_id).execute()
    return {"item": response.data[0]}


@router.delete("/subtopics/{subtopic_id}")
def delete_subtopic(subtopic_id: str):
    client = get_supabase_admin()
    _fetch_single(client, "subtopics", subtopic_id)
    client.table("subtopics").delete().eq("id", subtopic_id).execute()
    return {"deleted": True}


@router.get("/colleges")
def list_colleges():
    client = get_supabase_admin()
    try:
        colleges = client.table("colleges").select("*").order("name").execute().data or []
        batch_count_by_college, _student_count_by_batch = _batch_counts(client)
    except APIError as exc:
        _raise_batch_api_error(exc)

    return {
        "items": [
            {**college, "batch_count": batch_count_by_college.get(college["id"], 0)}
            for college in colleges
        ]
    }


@router.get("/colleges/{college_id}")
def get_college(college_id: str):
    client = get_supabase_admin()
    try:
        college = _fetch_single(client, "colleges", college_id)
        batch_count_by_college, _student_count_by_batch = _batch_counts(client)
    except APIError as exc:
        _raise_batch_api_error(exc)

    return {"item": {**college, "batch_count": batch_count_by_college.get(college_id, 0)}}


@router.post("/colleges")
def create_college(payload: CollegeCreate):
    client = get_supabase_admin()
    try:
        response = client.table("colleges").insert(payload.model_dump()).execute()
    except APIError as exc:
        _raise_batch_api_error(exc)
    return {"item": {**response.data[0], "batch_count": 0}}


@router.put("/colleges/{college_id}")
def update_college(college_id: str, payload: CollegeUpdate):
    client = get_supabase_admin()
    try:
        _fetch_single(client, "colleges", college_id)
        response = client.table("colleges").update(payload.model_dump()).eq("id", college_id).execute()
    except APIError as exc:
        _raise_batch_api_error(exc)
    return {"item": response.data[0]}


@router.get("/colleges/{college_id}/batches")
def list_college_batches(college_id: str):
    client = get_supabase_admin()
    try:
        college = _fetch_single(client, "colleges", college_id)
        batches = (
            client.table("batches")
            .select("*")
            .eq("college_id", college_id)
            .order("created_at", desc=True)
            .execute()
            .data
            or []
        )
        _batch_count_by_college, student_count_by_batch = _batch_counts(client)
    except APIError as exc:
        _raise_batch_api_error(exc)

    return {
        "college": college,
        "items": [
            {**batch, "student_count": student_count_by_batch.get(batch["id"], 0)}
            for batch in batches
        ],
    }


@router.get("/batches")
def list_batches():
    client = get_supabase_admin()
    try:
        batches = client.table("batches").select("*, colleges(name, info)").order("created_at", desc=True).execute().data or []
        _batch_count_by_college, student_count_by_batch = _batch_counts(client)
    except APIError as exc:
        _raise_batch_api_error(exc)

    return {"items": [{**batch, "student_count": student_count_by_batch.get(batch["id"], 0)} for batch in batches]}


@router.post("/batches")
def create_batch(payload: BatchCreate):
    client = get_supabase_admin()
    try:
        college_id = _resolve_batch_college_id(client, payload)
        response = client.table("batches").insert(
            {
                "name": payload.name,
                "description": payload.description,
                "active": payload.active,
                "college_id": college_id,
            }
        ).execute()
    except APIError as exc:
        _raise_batch_api_error(exc)
    return {"item": {**response.data[0], "student_count": 0}}


@router.put("/batches/{batch_id}")
def update_batch(batch_id: str, payload: BatchUpdate):
    client = get_supabase_admin()
    try:
        _fetch_single(client, "batches", batch_id)
        college_id = _resolve_batch_college_id(client, payload)
        response = client.table("batches").update(
            {
                "name": payload.name,
                "description": payload.description,
                "active": payload.active,
                "college_id": college_id,
            }
        ).eq("id", batch_id).execute()
    except APIError as exc:
        _raise_batch_api_error(exc)
    return {"item": response.data[0]}


@router.delete("/batches/{batch_id}")
def delete_batch(batch_id: str):
    client = get_supabase_admin()
    try:
        _fetch_single(client, "batches", batch_id)
        client.table("batches").delete().eq("id", batch_id).execute()
    except APIError as exc:
        _raise_batch_api_error(exc)
    return {"deleted": True}


@router.get("/batches/{batch_id}/students")
def list_batch_students(batch_id: str):
    client = get_supabase_admin()
    _fetch_single(client, "batches", batch_id)

    memberships = (
        client.table("batch_users")
        .select("*")
        .eq("batch_id", batch_id)
        .order("joined_at", desc=True)
        .execute()
        .data
        or []
    )
    profile_ids = [membership["profile_id"] for membership in memberships]
    if not profile_ids:
        return {"items": []}

    profiles = client.table("profiles").select("*").in_("id", profile_ids).execute().data or []
    academics = client.table("profile_academics").select("*").in_("profile_id", profile_ids).execute().data or []
    profile_by_id = {profile["id"]: profile for profile in profiles}
    academics_by_id = {academic["profile_id"]: academic for academic in academics}

    return {
        "items": [
            {
                **membership,
                "profile": profile_by_id.get(membership["profile_id"], {}),
                "academics": academics_by_id.get(membership["profile_id"], {}),
            }
            for membership in memberships
        ]
    }


@router.post("/batches/{batch_id}/students")
def create_batch_student(batch_id: str, payload: BatchStudentCreate):
    client = get_supabase_admin()
    return {"item": _upsert_batch_student(client, batch_id, payload)}


@router.put("/batches/{batch_id}/students/{profile_id}")
def update_batch_student(batch_id: str, profile_id: str, payload: BatchStudentUpdate):
    client = get_supabase_admin()
    _get_batch_student(client, batch_id, profile_id)

    profile_data = {
        "email": payload.email.strip().lower(),
        "full_name": payload.full_name,
        "role": "student",
        "phone": payload.phone,
        "college": payload.college,
        "department": payload.department,
        "year_of_graduation": payload.year_of_graduation,
    }
    client.table("profiles").update(profile_data).eq("id", profile_id).execute()
    client.table("profile_academics").upsert(
        {
            "profile_id": profile_id,
            "tenth_percentage": payload.tenth_percentage,
            "twelfth_percentage": payload.twelfth_percentage,
            "graduation_cgpa": payload.graduation_cgpa,
            "backlogs": payload.backlogs,
            "gap_years": payload.gap_years,
            "gap_during_grad": payload.gap_during_grad,
        }
    ).execute()
    client.table("batch_users").update(
        {
            "roll_number": payload.roll_number,
            "status": _normalize_student_status(payload.status),
        }
    ).eq("batch_id", batch_id).eq("profile_id", profile_id).execute()
    return {"item": _get_batch_student(client, batch_id, profile_id)}


@router.delete("/batches/{batch_id}/students/{profile_id}")
def delete_batch_student(batch_id: str, profile_id: str):
    client = get_supabase_admin()
    _get_batch_student(client, batch_id, profile_id)
    client.table("batch_users").delete().eq("batch_id", batch_id).eq("profile_id", profile_id).execute()
    return {"deleted": True}


@router.post("/batches/{batch_id}/students/bulk")
def bulk_import_batch_students(batch_id: str, payload: BatchStudentBulkImport):
    client = get_supabase_admin()
    created = [_upsert_batch_student(client, batch_id, student) for student in payload.students]
    return {"created_count": len(created), "items": created}


@router.get("/tests")
def list_tests():
    client = get_supabase_admin()
    response = (
        client.table("tests")
        .select("*, companies(name), subjects(name), topics(name)")
        .order("created_at", desc=True)
        .execute()
    )
    return {"items": response.data}


@router.post("/tests")
def create_test(payload: TestCreate):
    client = get_supabase_admin()
    if payload.topic_id:
        topic = _fetch_single(client, "topics", payload.topic_id)
        if payload.subject_id and topic["subject_id"] != payload.subject_id:
            raise HTTPException(status_code=400, detail="Test topic does not belong to the selected subject")
    response = client.table("tests").insert(payload.model_dump()).execute()
    return {"item": response.data[0]}


@router.put("/tests/{test_id}")
def update_test(test_id: str, payload: TestUpdate):
    client = get_supabase_admin()
    _fetch_single(client, "tests", test_id)
    if payload.topic_id:
        topic = _fetch_single(client, "topics", payload.topic_id)
        if payload.subject_id and topic["subject_id"] != payload.subject_id:
            raise HTTPException(status_code=400, detail="Test topic does not belong to the selected subject")
    response = client.table("tests").update(payload.model_dump()).eq("id", test_id).execute()
    return {"item": response.data[0]}


@router.delete("/tests/{test_id}")
def delete_test(test_id: str):
    client = get_supabase_admin()
    _fetch_single(client, "tests", test_id)
    client.table("test_questions").delete().eq("test_id", test_id).execute()
    client.table("tests").delete().eq("id", test_id).execute()
    return {"deleted": True}


@router.get("/test-questions")
def list_test_questions(test_id: str):
    client = get_supabase_admin()
    response = (
        client.table("test_questions")
        .select("*, questions(title, question_type, difficulty, status, subject_id, topic_id, subtopic_id, subjects(name), topics(name), subtopics(name))")
        .eq("test_id", test_id)
        .order("sort_order")
        .execute()
    )
    return {"items": response.data}


@router.post("/test-questions")
def create_test_question(payload: TestQuestionCreate):
    client = get_supabase_admin()
    _ensure_question_matches_test(client, payload)

    existing = (
        client.table("test_questions")
        .select("test_id, question_id")
        .eq("test_id", payload.test_id)
        .eq("question_id", payload.question_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="Question is already attached to this test")

    response = client.table("test_questions").insert(payload.model_dump()).execute()
    return {"item": response.data[0]}


@router.put("/test-questions")
def update_test_question(test_id: str, question_id: str, payload: TestQuestionUpdate):
    client = get_supabase_admin()
    existing = (
        client.table("test_questions")
        .select("*")
        .eq("test_id", test_id)
        .eq("question_id", question_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Test question link not found")

    response = (
        client.table("test_questions")
        .update(payload.model_dump())
        .eq("test_id", test_id)
        .eq("question_id", question_id)
        .execute()
    )
    return {"item": response.data[0]}


@router.delete("/test-questions")
def delete_test_question(test_id: str, question_id: str):
    client = get_supabase_admin()
    existing = (
        client.table("test_questions")
        .select("*")
        .eq("test_id", test_id)
        .eq("question_id", question_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Test question link not found")

    client.table("test_questions").delete().eq("test_id", test_id).eq("question_id", question_id).execute()
    return {"deleted": True}


@router.get("/programming-problems")
def list_programming_problems():
    client = get_supabase_admin()
    response = (
        client.table("programming_problems")
        .select("*, questions(title, question_type, difficulty)")
        .order("created_at", desc=True)
        .execute()
    )
    return {"items": response.data}


@router.post("/programming-problems")
def create_programming_problem(payload: ProgrammingProblemCreate):
    client = get_supabase_admin()

    question = (
        client.table("questions")
        .select("id, question_type")
        .eq("id", payload.question_id)
        .limit(1)
        .execute()
    )
    if not question.data:
        raise HTTPException(status_code=404, detail="Question not found")

    response = client.table("programming_problems").insert(payload.model_dump()).execute()
    return {"item": response.data[0]}


@router.put("/programming-problems/{problem_id}")
def update_programming_problem(problem_id: str, payload: ProgrammingProblemUpdate):
    client = get_supabase_admin()
    _fetch_single(client, "programming_problems", problem_id)
    response = (
        client.table("programming_problems")
        .update(payload.model_dump())
        .eq("id", problem_id)
        .execute()
    )
    return {"item": response.data[0]}


@router.delete("/programming-problems/{problem_id}")
def delete_programming_problem(problem_id: str):
    client = get_supabase_admin()
    _fetch_single(client, "programming_problems", problem_id)
    client.table("programming_problems").delete().eq("id", problem_id).execute()
    return {"deleted": True}


@router.get("/questions")
def list_questions(question_type: str | None = None):
    client = get_supabase_admin()
    query = (
        client.table("questions")
        .select("*, subjects(name), topics(name, subject_id), subtopics(name, topic_id), question_options(*), coding_test_cases(*)")
        .order("created_at", desc=True)
    )
    if question_type:
        query = query.eq("question_type", question_type)
    response = query.execute()
    return {"items": response.data}


@router.get("/questions/audit")
def audit_questions():
    client = get_supabase_admin()
    questions = (
        client.table("questions")
        .select("*, subjects(name), topics(name, subject_id), subtopics(name, topic_id), question_options(*), coding_test_cases(*)")
        .order("created_at", desc=True)
        .execute()
        .data
        or []
    )
    tests = client.table("tests").select("id,title,subject_id,topic_id,is_active").execute().data or []
    test_lookup = {test["id"]: test for test in tests}
    links = (
        client.table("test_questions")
        .select("test_id,question_id, questions(id,title,subject_id,topic_id,status)")
        .execute()
        .data
        or []
    )

    question_issues = [
        {
            "id": question["id"],
            "title": question.get("title") or question.get("prompt", "")[:80],
            "status": question.get("status") or "draft",
            "question_type": question.get("question_type") or "unknown",
            "issues": issues,
        }
        for question in questions
        if (issues := _question_taxonomy_issues(question))
    ]

    test_issues = []
    for link in links:
        test = test_lookup.get(link.get("test_id"))
        question = link.get("questions") or {}
        if not test or not question:
            continue
        issues = []
        if test.get("topic_id") and question.get("topic_id") != test["topic_id"]:
            issues.append("Question topic does not match test topic")
        if test.get("subject_id") and question.get("subject_id") != test["subject_id"]:
            issues.append("Question subject does not match test subject")
        if test.get("is_active") and _normalize_question_status(str(question.get("status") or "draft")) != "published":
            issues.append("Active test contains a non-published question")
        if issues:
            test_issues.append(
                {
                    "test_id": test["id"],
                    "test_title": test["title"],
                    "question_id": question.get("id"),
                    "question_title": question.get("title") or "Untitled question",
                    "issues": issues,
                }
            )

    return {
        "summary": {
            "questions_checked": len(questions),
            "question_issues": len(question_issues),
            "test_issues": len(test_issues),
        },
        "question_issues": question_issues,
        "test_issues": test_issues,
    }


@router.post("/questions")
def create_question(payload: QuestionCreate):
    client = get_supabase_admin()
    return {"item": _create_question_record(client, payload)}


@router.post("/questions/bulk")
def bulk_import_questions(payload: QuestionBulkImport):
    client = get_supabase_admin()
    created = [_create_question_record(client, question) for question in payload.questions]
    return {"created_count": len(created), "items": created}


@router.put("/questions/{question_id}")
def update_question(question_id: str, payload: QuestionUpdate):
    _validate_question_payload(payload)

    client = get_supabase_admin()
    _fetch_single(client, "questions", question_id)
    question_data = _canonical_question_data(client, payload)

    response = client.table("questions").update(question_data).eq("id", question_id).execute()

    client.table("question_options").delete().eq("question_id", question_id).execute()
    client.table("coding_test_cases").delete().eq("question_id", question_id).execute()

    if question_data["question_type"] == "mcq" and payload.options:
        options_payload = [
            {
                "question_id": question_id,
                "option_key": option.option_key,
                "option_text": option.option_text,
                "is_correct": option.is_correct,
                "sort_order": option.sort_order,
            }
            for option in payload.options
        ]
        client.table("question_options").insert(options_payload).execute()
    elif question_data["question_type"] == "coding" and payload.coding_test_cases:
        test_case_payload = [
            {
                "question_id": question_id,
                "input_text": test_case.input_text,
                "expected_output": test_case.expected_output,
                "is_hidden": test_case.is_hidden,
                "sort_order": test_case.sort_order,
            }
            for test_case in payload.coding_test_cases
        ]
        client.table("coding_test_cases").insert(test_case_payload).execute()

    full_question = (
        client.table("questions")
        .select("*, subjects(name), topics(name, subject_id), subtopics(name, topic_id), question_options(*), coding_test_cases(*)")
        .eq("id", question_id)
        .limit(1)
        .execute()
    )
    return {"item": full_question.data[0] if full_question.data else response.data[0]}


@router.delete("/questions/{question_id}")
def delete_question(question_id: str):
    client = get_supabase_admin()
    _fetch_single(client, "questions", question_id)
    client.table("question_options").delete().eq("question_id", question_id).execute()
    client.table("coding_test_cases").delete().eq("question_id", question_id).execute()
    client.table("test_questions").delete().eq("question_id", question_id).execute()
    client.table("programming_problems").delete().eq("question_id", question_id).execute()
    client.table("questions").delete().eq("id", question_id).execute()
    return {"deleted": True}
