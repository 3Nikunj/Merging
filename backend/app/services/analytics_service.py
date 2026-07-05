from app.schemas.analytics import Recommendation, RecommendationsResponse, WeakArea, WeakAreasResponse
from app.services.mock_data import RECOMMENDATIONS, WEAK_AREAS


class AnalyticsService:
    def get_recommendations(self, user_id: str) -> RecommendationsResponse:
        return RecommendationsResponse(
            recommendations=[Recommendation.model_validate(item) for item in RECOMMENDATIONS]
        )

    def get_weak_areas(self, user_id: str) -> WeakAreasResponse:
        return WeakAreasResponse(
            weak_areas=[WeakArea.model_validate(item) for item in WEAK_AREAS]
        )


analytics_service = AnalyticsService()
