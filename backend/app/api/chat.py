from fastapi import APIRouter, HTTPException, status
from app.models.schemas import ChatRequest, ChatResponse
from app.services.rag_service import get_rag_service

router = APIRouter(prefix="/api/chat", tags=["Chat"])
rag_service = get_rag_service()

@router.post("", response_model=ChatResponse)
async def chat_with_tutor(request: ChatRequest):
    """
    Asks the AI tutor a question based on uploaded study materials.
    Performs vector similarity search in FAISS, builds context, and responds in the selected learning level & style.
    """
    if not request.question or not request.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty."
        )

    try:
        response = rag_service.query(
            question=request.question.strip(),
            document_ids=request.document_ids,
            session_id=request.session_id,
            learning_level=request.learning_level or "beginner",
            response_style=request.response_style or "simple"
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"The AI tutor is temporarily unavailable: {str(e)}"
        )
