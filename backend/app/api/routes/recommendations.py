from fastapi import APIRouter

from app.schemas.analytics import RecommendationsResponse, WeakAreasResponse
from app.services.analytics_service import analytics_service

router = APIRouter()


@router.get("/{user_id}/recommendations", response_model=RecommendationsResponse)
def get_recommendations(user_id: str) -> RecommendationsResponse:
    return analytics_service.get_recommendations(user_id)


@router.get("/{user_id}/weak-areas", response_model=WeakAreasResponse)
def get_weak_areas(user_id: str) -> WeakAreasResponse:
    return analytics_service.get_weak_areas(user_id)
