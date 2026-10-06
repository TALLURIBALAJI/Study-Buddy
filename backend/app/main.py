from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS, LLM_MODEL, LLM_API_KEY
from app.models.database import init_db
from app.services.vector_store_service import get_vector_store
from app.api.documents import router as documents_router
from app.api.chat import router as chat_router
from app.api.sessions import router as sessions_router
from app.api.study import router as study_router
from app.api.settings import router as settings_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    print("[StudyBuddy AI] Initializing backend services...")
    init_db()
    vector_store = get_vector_store()
    print(f"[StudyBuddy AI] Ready! Clean vector store contains {vector_store.count()} chunks.")
    yield
    # Shutdown actions
    print("[StudyBuddy AI] Shutting down backend...")

app = FastAPI(
    title="StudyBuddy AI Backend",
    description="RAG-powered AI study assistant that explains difficult concepts from your uploaded documents.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(sessions_router)
app.include_router(study_router)
app.include_router(settings_router)

@app.get("/")
def read_root():
    return {
        "service": "StudyBuddy AI API",
        "status": "online",
        "documentation": "/docs"
    }

@app.get("/api/health")
def health_check():
    vector_store = get_vector_store()
    return {
        "status": "healthy",
        "llm_provider": "gemini" if LLM_API_KEY else "smart_offline_tutor",
        "model": LLM_MODEL if LLM_API_KEY else "built-in-rag-synthesizer",
        "indexed_chunks": vector_store.count()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
