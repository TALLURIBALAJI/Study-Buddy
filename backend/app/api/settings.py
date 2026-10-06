import os
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, HTTPException
import app.config as config
from app.services.llm_service import get_llm_service
from app.services.vector_store_service import get_vector_store
from app.models.database import get_db, init_db

router = APIRouter(prefix="/api/settings", tags=["settings"])

class APIKeyRequest(BaseModel):
    api_key: str

@router.get("")
def get_settings():
    llm = get_llm_service()
    vs = get_vector_store()
    current_key = llm.api_key or config.LLM_API_KEY or ""
    
    masked = ""
    if current_key:
        if len(current_key) > 8:
            masked = current_key[:4] + "..." + current_key[-4:]
        else:
            masked = "***"

    return {
        "has_api_key": bool(current_key),
        "masked_api_key": masked,
        "llm_provider": "gemini" if bool(current_key) else "smart_offline_tutor",
        "model": config.LLM_MODEL if bool(current_key) else "built-in-rag-synthesizer",
        "indexed_chunks": vs.count()
    }

@router.post("/api-key")
def update_api_key(req: APIKeyRequest):
    new_key = req.api_key.strip()
    
    # 1. Update in-memory service
    llm = get_llm_service()
    llm.set_api_key(new_key)
    config.LLM_API_KEY = new_key
    
    # 2. Persist to backend/.env
    env_file = config.BASE_DIR / ".env"
    try:
        lines = []
        if env_file.exists():
            with open(env_file, "r", encoding="utf-8") as f:
                lines = f.readlines()
        
        found = False
        new_lines = []
        for line in lines:
            if line.startswith("LLM_API_KEY="):
                new_lines.append(f"LLM_API_KEY={new_key}\n")
                found = True
            else:
                new_lines.append(line)
        if not found:
            new_lines.append(f"LLM_API_KEY={new_key}\n")
            
        with open(env_file, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
    except Exception as e:
        print(f"Warning: Could not save key to .env: {e}")

    return {
        "success": True,
        "has_api_key": bool(new_key),
        "message": "Gemini API key updated successfully!" if new_key else "API key cleared. Using local RAG tutor."
    }

@router.post("/clear-all")
def clear_all_data():
    """Wipes all documents, sessions, messages and vector store indexes."""
    # 1. Clear uploads folder
    if config.UPLOAD_DIR.exists():
        for f in config.UPLOAD_DIR.iterdir():
            if f.is_file():
                try:
                    f.unlink()
                except Exception as e:
                    print(f"Failed to delete {f.name}: {e}")

    # 2. Reset vector store
    vs = get_vector_store()
    vs.clear_all()

    # 3. Clear database tables
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM messages")
    cursor.execute("DELETE FROM sessions")
    cursor.execute("DELETE FROM documents")
    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": "All documents, sessions and vector store data have been erased successfully."
    }
