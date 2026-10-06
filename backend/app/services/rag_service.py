from typing import List, Dict, Any, Optional
from app.services.vector_store_service import get_vector_store
from app.services.llm_service import get_llm_service
from app.models.database import db_add_message, db_get_all_documents
import uuid

class RAGService:
    def __init__(self):
        self.vector_store = get_vector_store()
        self.llm_service = get_llm_service()

    def query(
        self,
        question: str,
        document_ids: Optional[List[str]] = None,
        session_id: Optional[str] = None,
        learning_level: str = "beginner",
        response_style: str = "simple"
    ) -> Dict[str, Any]:
        """
        Executes end-to-end RAG:
        1. Search FAISS for relevant chunks
        2. Filter and score citations
        3. Assemble grounded prompt context
        4. Invoke LLM tutor service
        5. Persist interaction in session if session_id provided
        """
        all_docs = db_get_all_documents()
        
        # If no document_ids specified but only 1 document exists, target that document
        active_doc_ids = document_ids
        if not active_doc_ids and len(all_docs) == 1:
            active_doc_ids = [all_docs[0]["id"]]

        # 1. Similarity search
        results = self.vector_store.search(
            query=question,
            top_k=5,
            document_ids=active_doc_ids
        )

        # If results are sparse (e.g. general questions like "summarize this" or "what is in this document?"),
        # supplement with initial chunks of the targeted document so the tutor has overview context
        if active_doc_ids and len(results) < 3:
            target_id = active_doc_ids[0]
            existing_chunk_ids = {r.get("chunk_id") for r in results}
            doc_chunks = [
                c for c in self.vector_store.metadata 
                if c.get("document_id") == target_id and c.get("chunk_id") not in existing_chunk_ids
            ]
            # Add top document chunks
            for extra in doc_chunks[:(4 - len(results))]:
                extra_copy = dict(extra)
                extra_copy["score"] = 0.50
                results.append(extra_copy)

        sources = []
        context_parts = []
        
        for r in results:
            score = r.get("score", 0.0)
            doc_name = r.get("document_name", "Uploaded Document")
            page_num = r.get("page_number", 1)
            text = r.get("text", "")
            
            context_parts.append(f"[Source: {doc_name} — Page {page_num}]\n{text}")
            
            excerpt = text[:220] + ("..." if len(text) > 220 else "")
            sources.append({
                "document_id": r.get("document_id"),
                "document_name": doc_name,
                "page": page_num,
                "excerpt": excerpt,
                "score": round(score, 3)
            })

        combined_context = "\n\n---\n\n".join(context_parts)

        # 2. Call LLM
        answer, follow_ups = self.llm_service.generate_response(
            question=question,
            context=combined_context,
            learning_level=learning_level,
            response_style=response_style
        )

        # 3. If session_id provided, record messages in database
        if session_id:
            user_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
            db_add_message(
                message_id=user_msg_id,
                session_id=session_id,
                role="user",
                content=question
            )
            assistant_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
            db_add_message(
                message_id=assistant_msg_id,
                session_id=session_id,
                role="assistant",
                content=answer,
                sources=sources,
                follow_ups=follow_ups
            )

        return {
            "answer": answer,
            "sources": sources,
            "follow_ups": follow_ups,
            "session_id": session_id
        }

_rag_service_instance = None

def get_rag_service() -> RAGService:
    global _rag_service_instance
    if _rag_service_instance is None:
        _rag_service_instance = RAGService()
    return _rag_service_instance
