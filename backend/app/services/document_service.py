import os
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.config import UPLOAD_DIR
from app.models.database import (
    db_insert_document,
    db_update_document_status,
    db_get_all_documents,
    db_get_document,
    db_delete_document
)
from app.utils.file_processing import (
    sanitize_filename,
    validate_file,
    extract_text_from_file
)
from app.utils.text_processing import chunk_document_pages
from app.services.vector_store_service import get_vector_store

class DocumentService:
    def __init__(self):
        self.vector_store = get_vector_store()

    def process_and_save_upload(self, file_obj, filename: str, file_size: int, is_demo: bool = False) -> Dict[str, Any]:
        """
        Executes the full pipeline:
        Validate -> Save -> Extract -> Clean -> Chunk -> Embed & Index -> Mark Ready.
        """
        clean_name = sanitize_filename(filename)
        valid, err_msg = validate_file(clean_name, file_size)
        if not valid:
            raise ValueError(err_msg)

        doc_id = f"doc_{uuid.uuid4().hex[:12]}"
        kind = clean_name.split(".")[-1].lower()
        save_path = UPLOAD_DIR / f"{doc_id}_{clean_name}"

        # 1. Save File
        try:
            with open(save_path, "wb") as buffer:
                shutil.copyfileobj(file_obj, buffer)
        except Exception as e:
            raise IOError(f"Failed to save file: {str(e)}")

        # 2. Insert DB record with status 'uploading'
        db_insert_document(
            doc_id=doc_id,
            name=clean_name,
            kind=kind,
            size_bytes=file_size,
            pages=1,
            status="uploading",
            file_path=str(save_path),
            is_demo=is_demo
        )

        try:
            # 3. Extract text
            db_update_document_status(doc_id, "extracting")
            pages_data = extract_text_from_file(str(save_path))
            page_count = len(pages_data)

            # 4. Chunk text
            db_update_document_status(doc_id, "processing", pages=page_count)
            chunks = chunk_document_pages(
                pages=pages_data,
                document_id=doc_id,
                document_name=clean_name
            )

            # 5. Index into FAISS
            db_update_document_status(doc_id, "indexing")
            self.vector_store.add_chunks(chunks)

            # 6. Mark Ready
            db_update_document_status(doc_id, "ready", pages=page_count)

            now_str = datetime.utcnow().isoformat() + "Z"
            return {
                "id": doc_id,
                "name": clean_name,
                "kind": kind,
                "size_bytes": file_size,
                "pages": page_count,
                "uploaded_at": now_str,
                "status": "ready",
                "is_demo": is_demo
            }

        except Exception as e:
            # Mark processing failed
            db_update_document_status(doc_id, "failed")
            # Log error
            print(f"Document processing failed for {clean_name}: {e}")
            raise e

    def get_all_documents(self) -> List[Dict[str, Any]]:
        return db_get_all_documents()

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        return db_get_document(doc_id)

    def delete_document(self, doc_id: str):
        doc = db_get_document(doc_id)
        if not doc:
            raise KeyError("Document not found")

        # 1. Remove from vector store
        self.vector_store.delete_document(doc_id)

        # 2. Delete file on disk
        file_path = Path(doc["file_path"])
        if file_path.exists():
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Warning: failed to delete file on disk: {e}")

        # 3. Delete from DB
        db_delete_document(doc_id)

    def get_document_full_text(self, doc_id: str) -> str:
        """Retrieves all text chunks of a document for summarization or quiz."""
        chunks = [c for c in self.vector_store.metadata if c.get("document_id") == doc_id]
        if chunks:
            # Sort by page_number
            chunks_sorted = sorted(chunks, key=lambda x: x.get("page_number", 1))
            return "\n\n".join(c["text"] for c in chunks_sorted)
        
        # If not in vector store, read from disk
        doc = db_get_document(doc_id)
        if doc and Path(doc["file_path"]).exists():
            pages = extract_text_from_file(doc["file_path"])
            return "\n\n".join(p["text"] for p in pages)
            
        return ""

_document_service_instance = None

def get_document_service() -> DocumentService:
    global _document_service_instance
    if _document_service_instance is None:
        _document_service_instance = DocumentService()
    return _document_service_instance
