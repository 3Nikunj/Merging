from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependency import get_current_user_id
from app.schemas.analytics import RecommendationsResponse, WeakAreasResponse
from app.services.analytics_service import analytics_service

router = APIRouter()
AuthenticatedUserId = Annotated[str, Depends(get_current_user_id)]


@router.get("/me/recommendations", response_model=RecommendationsResponse)
def get_current_user_recommendations(
    current_user_id: AuthenticatedUserId,
) -> RecommendationsResponse:
    return analytics_service.get_recommendations(current_user_id)


@router.get("/me/weak-areas", response_model=WeakAreasResponse)
def get_current_user_weak_areas(
    current_user_id: AuthenticatedUserId,
) -> WeakAreasResponse:
    return analytics_service.get_weak_areas(current_user_id)


@router.get("/{user_id}/recommendations", response_model=RecommendationsResponse)
def get_recommendations(
    user_id: str,
    current_user_id: AuthenticatedUserId,
) -> RecommendationsResponse:
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return analytics_service.get_recommendations(current_user_id)


@router.get("/{user_id}/weak-areas", response_model=WeakAreasResponse)
def get_weak_areas(
    user_id: str,
    current_user_id: AuthenticatedUserId,
) -> WeakAreasResponse:
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return analytics_service.get_weak_areas(current_user_id)
