"""
Data Dictionary Generator – FastAPI backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import settings
from routers import connections, metadata, quality, ai_summary, chat
from services.db_connector import load_cached_connections

app = FastAPI(
    title="Data Dictionary Generator",
    version="1.0.0",
    description="AI-enhanced data dictionary platform",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Load cached database connections on startup."""
    load_cached_connections()


# ── Routes ──────────────────────────────────────────────
app.include_router(connections.router, prefix="/api/connections", tags=["Connections"])
app.include_router(metadata.router, prefix="/api/metadata", tags=["Metadata"])
app.include_router(quality.router, prefix="/api/quality", tags=["Data Quality"])
app.include_router(ai_summary.router, prefix="/api/ai", tags=["AI"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
