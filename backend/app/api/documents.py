from fastapi import APIRouter, UploadFile, File, HTTPException, status
from typing import List
from app.services.document_service import get_document_service
from app.models.schemas import DocumentResponse, DocumentListResponse

router = APIRouter(prefix="/api/documents", tags=["Documents"])
document_service = get_document_service()

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(file: UploadFile = File(...)):
    """Uploads, extracts, chunks, and indexes a study document (PDF, DOCX, TXT)."""
    try:
        # Read file size
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)

        result = document_service.process_and_save_upload(
            file_obj=file.file,
            filename=file.filename or "uploaded_document.txt",
            file_size=file_size
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Processing failed: {str(e)}"
        )

@router.get("", response_model=DocumentListResponse)
async def list_documents():
    """Returns all available documents in the library."""
    docs = document_service.get_all_documents()
    return {
        "documents": docs,
        "total": len(docs)
    }

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str):
    """Retrieves metadata for a specific document."""
    doc = document_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc

@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
async def delete_document(document_id: str):
    """Deletes a document, its index vectors, and stored file."""
    try:
        document_service.delete_document(document_id)
        return {"success": True, "message": "Document deleted successfully"}
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
