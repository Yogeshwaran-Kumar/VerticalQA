"""
main.py
────────
FastAPI application entry point.

Responsibilities:
  - Create the FastAPI app instance
  - Register lifecycle events (preload SpeechBrain SER model on startup)
  - Mount WebSocket and REST routes
  - Provide a health-check endpoint
  - Configure CORS
"""

import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.session_manager import SessionManager
from app.routes.websocket import build_ws_router

logger = structlog.get_logger()

session_manager = SessionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Vertical QA Backend", version=settings.APP_VERSION)
    try:
        from app.services.acoustic_service import preload_model
        await preload_model()
        logger.info("SpeechBrain SER model loaded")
    except Exception as e:
        logger.warning("SpeechBrain preload failed — mock mode active", error=str(e))
    yield
    logger.info("Shutting down Vertical QA Backend")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Real-Time Call Center Quality Auditor — WebSocket backend",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten to specific frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ws_router = build_ws_router(session_manager)
app.include_router(ws_router)


@app.get("/health", tags=["System"])
async def health_check():
    """Health endpoint — returns system status and active session count."""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "active_sessions": session_manager.active_session_count(),
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "message": f"{settings.APP_NAME} is running. "
                   f"Connect via WebSocket at /ws/{{session_id}}"
    }
