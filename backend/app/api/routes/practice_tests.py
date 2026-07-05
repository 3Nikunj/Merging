from fastapi import APIRouter

from app.schemas.practice_test import PracticeTestsResponse, SelectionDataResponse
from app.services.practice_test_service import practice_test_service

router = APIRouter()


@router.get("", response_model=PracticeTestsResponse)
def list_practice_tests() -> PracticeTestsResponse:
    return practice_test_service.list_practice_tests()


@router.get("/selection-data", response_model=SelectionDataResponse)
def get_selection_data() -> SelectionDataResponse:
    return practice_test_service.get_selection_data()


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
