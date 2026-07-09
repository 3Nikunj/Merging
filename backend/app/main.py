import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.api.routes.admin import router as admin_router
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AiValytics API",
    description="Python + FastAPI backend for Student Portal and Admin CMS.",
    version="0.1.0",
    docs_url=None if settings.app_env == "production" else "/docs",
    redoc_url=None if settings.app_env == "production" else "/redoc",
    openapi_url=None if settings.app_env == "production" else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(Exception)
async def handle_unexpected_exception(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    """Log unexpected failures without exposing internal details to clients."""
    logger.exception(
        "Unhandled API error for %s %s",
        request.method,
        request.url.path,
        exc_info=exc,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

app.include_router(api_router, prefix="/api")
app.include_router(admin_router)

