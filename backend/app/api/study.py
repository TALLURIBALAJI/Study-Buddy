from fastapi import APIRouter, HTTPException, status
from app.models.schemas import SummarizeRequest, SummaryResponse, QuizRequest, QuizResponse
from app.services.document_service import get_document_service
from app.services.llm_service import get_llm_service

router = APIRouter(prefix="/api/study", tags=["Study Features"])
document_service = get_document_service()
llm_service = get_llm_service()

@router.post("/summarize", response_model=SummaryResponse)
async def summarize_document(request: SummarizeRequest):
    """Generates an intuitive, structured summary of a study document."""
    doc = document_service.get_document(request.document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    text = document_service.get_document_full_text(request.document_id)
    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="We couldn't extract readable text from this document to summarize."
        )

    summary_data = llm_service.generate_summary(
        document_name=doc["name"],
        context=text,
        learning_level=request.learning_level or "beginner"
    )

    return {
        "document_id": doc["id"],
        "document_name": doc["name"],
        "summary": summary_data.get("summary", ""),
        "key_points": summary_data.get("key_points", []),
        "real_world_analogy": summary_data.get("real_world_analogy")
    }

@router.post("/quiz", response_model=QuizResponse)
async def generate_quiz(request: QuizRequest):
    """Generates multiple-choice quiz questions with explanations from a study document."""
    doc = document_service.get_document(request.document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    text = document_service.get_document_full_text(request.document_id)
    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="We couldn't extract readable text from this document to generate a quiz."
        )

    quiz_data = llm_service.generate_quiz(
        document_name=doc["name"],
        context=text,
        num_questions=request.num_questions or 4,
        learning_level=request.learning_level or "beginner"
    )

    return {
        "document_id": doc["id"],
        "document_name": doc["name"],
        "quiz": quiz_data
    }
