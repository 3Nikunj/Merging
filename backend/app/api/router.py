from fastapi import APIRouter, Depends

from app.api.routes import attempts, health, hierarchy, practice_tests, recommendations
from app.auth.dependency import require_role

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(
    hierarchy.router,
    tags=["hierarchy"],
    dependencies=[Depends(require_role(["student", "admin"]))]
)
api_router.include_router(
    practice_tests.router,
    prefix="/practice-tests",
    tags=["practice-tests"],
    dependencies=[Depends(require_role(["student", "admin"]))]
)
api_router.include_router(
    attempts.router,
    prefix="/test-attempts",
    tags=["test-attempts"],
    dependencies=[Depends(require_role(["student", "admin"]))]
)
api_router.include_router(
    recommendations.router,
    prefix="/users",
    tags=["recommendations"],
    dependencies=[Depends(require_role(["student", "admin"]))]
)

