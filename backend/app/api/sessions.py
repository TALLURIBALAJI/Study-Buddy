import uuid
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.schemas import SessionSummary, SessionDetail, SessionCreate
from app.models.database import (
    db_get_all_sessions,
    db_get_session_details,
    db_create_session,
    db_upsert_session,
    db_delete_session
)

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])

@router.get("", response_model=List[SessionSummary])
async def list_sessions():
    """Lists all study sessions saved in SQLite database."""
    return db_get_all_sessions()

@router.post("", response_model=SessionDetail, status_code=status.HTTP_201_CREATED)
async def create_session(request: SessionCreate):
    """Creates a new study session."""
    session_id = f"s_{uuid.uuid4().hex[:12]}"
    created = db_create_session(
        session_id=session_id,
        title=request.title or "New Study Session",
        document_id=request.document_id,
        document_name=request.document_name
    )
    return created

@router.get("/{session_id}", response_model=SessionDetail)
async def get_session(session_id: str):
    """Retrieves session details including full message history."""
    session = db_get_session_details(session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session

@router.put("/{session_id}")
async def update_session(session_id: str, request: SessionCreate):
    """Updates session title or associated document."""
    db_upsert_session(
        session_id=session_id,
        title=request.title or "Study Session",
        document_id=request.document_id,
        document_name=request.document_name
    )
    session = db_get_session_details(session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session

@router.delete("/{session_id}", status_code=status.HTTP_200_OK)
async def delete_session(session_id: str):
    """Deletes a study session and all associated messages."""
    db_delete_session(session_id)
    return {"success": True, "message": "Session deleted"}
