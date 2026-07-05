from fastapi import APIRouter

from app.services.practice_test_service import practice_test_service

router = APIRouter()


@router.get("/subjects")
def list_subjects() -> dict:
    return {"subjects": practice_test_service.get_selection_data().subjects}


@router.get("/topics")
def list_topics(subject_id: str | None = None) -> dict:
    return {
        "subjectId": subject_id,
        "topics": practice_test_service.get_selection_data().topics,
    }


@router.get("/subtopics")
def list_subtopics(topic_id: str | None = None) -> dict:
    return {
        "topicId": topic_id,
        "subtopics": practice_test_service.get_selection_data().subtopics,
    }
