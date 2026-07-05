from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.api.routes.admin import router as admin_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="AiValytics API",
    description="Python + FastAPI backend for Student Portal and Admin CMS.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
app.include_router(admin_router)

