from app.schemas.analytics import (
    Recommendation, 
    RecommendationsResponse, 
    WeakArea, 
    WeakAreasResponse,
    DashboardStatsResponse
)
from app.services.mock_data import RECOMMENDATIONS, WEAK_AREAS
from app.core.supabase import get_supabase_client


class AnalyticsService:
    def get_recommendations(self, user_id: str) -> RecommendationsResponse:
        return RecommendationsResponse(
            recommendations=[Recommendation.model_validate(item) for item in RECOMMENDATIONS]
        )

    def get_weak_areas(self, user_id: str) -> WeakAreasResponse:
        return WeakAreasResponse(
            weak_areas=[WeakArea.model_validate(item) for item in WEAK_AREAS]
        )

    def get_dashboard_stats(self, user_id: str) -> DashboardStatsResponse:
        # Default mock values representing a healthy student state
        avg_test_score = 78.5
        tests_completed = 14
        coding_success_rate = 68.2
        coding_total_submissions = 22
        interview_average_score = 8.2
        interview_completed_count = 4

        client = get_supabase_client()
        if client:
            try:
                # 1. Fetch test attempts
                attempts_resp = client.table("test_attempts").select("percentage", "status").eq("user_id", user_id).eq("status", "submitted").execute()
                if attempts_resp.data:
                    percentages = [float(row["percentage"]) for row in attempts_resp.data if row.get("percentage") is not None]
                    tests_completed = len(percentages)
                    if tests_completed > 0:
                        avg_test_score = sum(percentages) / tests_completed

                # 2. Fetch coding submissions
                coding_resp = client.table("coding_submissions").select("status").eq("user_id", user_id).execute()
                if coding_resp.data:
                    coding_total_submissions = len(coding_resp.data)
                    accepted_count = sum(1 for row in coding_resp.data if row.get("status") == "accepted")
                    if coding_total_submissions > 0:
                        coding_success_rate = (accepted_count / coding_total_submissions) * 100

                # 3. Fetch AI interview sessions
                interview_resp = client.table("ai_interview_sessions").select("overall_score", "status").eq("student_id", user_id).eq("status", "completed").execute()
                if interview_resp.data:
                    scores = [float(row["overall_score"]) for row in interview_resp.data if row.get("overall_score") is not None]
                    interview_completed_count = len(scores)
                    if interview_completed_count > 0:
                        interview_average_score = sum(scores) / interview_completed_count
            except Exception as e:
                # Fallback to mock values on connection or RLS issues
                pass

        return DashboardStatsResponse(
            average_test_score=round(avg_test_score, 1),
            tests_completed=tests_completed,
            coding_success_rate=round(coding_success_rate, 1),
            coding_total_submissions=coding_total_submissions,
            interview_average_score=round(interview_average_score, 1),
            interview_completed_count=interview_completed_count
        )


analytics_service = AnalyticsService()
