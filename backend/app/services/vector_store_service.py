import json
import os
import threading
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np
import faiss
from app.config import VECTOR_STORE_DIR
from app.services.embedding_service import get_embedding_service

class VectorStoreService:
    def __init__(self):
        self.embedding_service = get_embedding_service()
        self.dim = self.embedding_service.dimension
        self.index_path = VECTOR_STORE_DIR / "faiss.index"
        self.metadata_path = VECTOR_STORE_DIR / "chunks_metadata.json"
        self.lock = threading.Lock()
        
        self.index: Optional[faiss.IndexFlatIP] = None
        self.metadata: List[Dict[str, Any]] = []  # parallel list corresponding to vector index rows
        
        self.load()

    def _init_new_index(self):
        # IndexFlatIP calculates inner product (cosine similarity for unit vectors)
        self.index = faiss.IndexFlatIP(self.dim)
        self.metadata = []

    def load(self):
        with self.lock:
            if self.index_path.exists() and self.metadata_path.exists():
                try:
                    self.index = faiss.read_index(str(self.index_path))
                    with open(self.metadata_path, "r", encoding="utf-8") as f:
                        self.metadata = json.load(f)
                    # Verify dimension matches
                    if self.index.d != self.dim:
                        self._init_new_index()
                except Exception as e:
                    print(f"Error loading FAISS index, creating new: {e}")
                    self._init_new_index()
            else:
                self._init_new_index()

    def save(self):
        with self.lock:
            if self.index is not None:
                faiss.write_index(self.index, str(self.index_path))
                with open(self.metadata_path, "w", encoding="utf-8") as f:
                    json.dump(self.metadata, f, ensure_ascii=False, indent=2)

    def add_chunks(self, chunks: List[Dict[str, Any]]):
        """
        Takes chunks and embeds and adds them to FAISS.
        Each chunk: {chunk_id, document_id, document_name, page_number, text}
        """
        if not chunks:
            return

        texts = [c["text"] for c in chunks]
        embeddings = self.embedding_service.embed_documents(texts)
        vecs = np.array(embeddings, dtype=np.float32)

        with self.lock:
            if self.index is None:
                self._init_new_index()
            self.index.add(vecs)
            self.metadata.extend(chunks)

        self.save()

    def search(
        self,
        query: str,
        top_k: int = 5,
        document_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Embeds query and searches FAISS.
        Filters by document_ids if provided.
        Returns list of chunks with added 'score' field.
        """
        if self.index is None or self.index.ntotal == 0:
            return []

        query_vec = np.array([self.embedding_service.embed_text(query)], dtype=np.float32)

        with self.lock:
            total_elements = self.index.ntotal
            # Search more if filtering is needed
            search_k = min(total_elements, top_k * 4 if document_ids else top_k)
            distances, indices = self.index.search(query_vec, search_k)

            results = []
            for dist, idx in zip(distances[0], indices[0]):
                if idx < 0 or idx >= len(self.metadata):
                    continue
                meta = dict(self.metadata[idx])
                
                # Check document filter
                if document_ids and meta.get("document_id") not in document_ids:
                    continue

                meta["score"] = float(dist)
                results.append(meta)

                if len(results) >= top_k:
                    break

        return results

    def delete_document(self, document_id: str):
        """
        Removes all chunks belonging to document_id by rebuilding index.
        """
        with self.lock:
            if not self.metadata:
                return

            remaining_chunks = [c for c in self.metadata if c.get("document_id") != document_id]
            if len(remaining_chunks) == len(self.metadata):
                return  # nothing to delete

            # Rebuild index
            self._init_new_index()
            if remaining_chunks:
                texts = [c["text"] for c in remaining_chunks]
                embeddings = self.embedding_service.embed_documents(texts)
                vecs = np.array(embeddings, dtype=np.float32)
                self.index.add(vecs)
                self.metadata = remaining_chunks

        self.save()

    def clear_all(self):
        """Removes all items from vector store and deletes saved index files."""
        with self.lock:
            self._init_new_index()
            if self.index_path.exists():
                try:
                    self.index_path.unlink()
                except Exception:
                    pass
            if self.metadata_path.exists():
                try:
                    self.metadata_path.unlink()
                except Exception:
                    pass
        self.save()

    def count(self) -> int:
        return self.index.ntotal if self.index else 0

_vector_store_instance = None

def get_vector_store() -> VectorStoreService:
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = VectorStoreService()
    return _vector_store_instance
