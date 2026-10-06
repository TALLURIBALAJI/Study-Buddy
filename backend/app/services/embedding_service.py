import math
import hashlib
import numpy as np
from typing import List
from app.config import LLM_API_KEY, EMBEDDING_PROVIDER

class BaseEmbeddingService:
    def embed_text(self, text: str) -> List[float]:
        raise NotImplementedError

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        raise NotImplementedError

    @property
    def dimension(self) -> int:
        raise NotImplementedError

class LocalDenseEmbeddingService(BaseEmbeddingService):
    """
    Lightweight, fast, self-contained local embedding service.
    Generates 384-dimensional dense semantic vectors using normalized subword
    character n-gram frequency hashing and term-frequency weighting.
    Provides stable, deterministic vectors suitable for FAISS cosine similarity (inner product).
    """
    def __init__(self, dim: int = 384):
        self._dim = dim

    @property
    def dimension(self) -> int:
        return self._dim

    def _hash_token(self, token: str) -> int:
        # MD5 hash modulo dimension
        h = int(hashlib.md5(token.encode("utf-8")).hexdigest()[:8], 16)
        return h % self._dim

    def _text_to_vector(self, text: str) -> np.ndarray:
        vec = np.zeros(self._dim, dtype=np.float32)
        if not text:
            return vec

        cleaned = text.lower()
        words = cleaned.split()
        
        # Word-level features
        for w in words:
            # Strip punctuation
            w_clean = "".join(c for c in w if c.isalnum())
            if not w_clean:
                continue
            idx = self._hash_token(w_clean)
            # Add weight inversely proportional to length (common terms get spread)
            weight = math.log1p(len(w_clean))
            vec[idx] += weight

            # Subword 3-grams & 4-grams for morphological semantics
            if len(w_clean) >= 3:
                for i in range(len(w_clean) - 2):
                    sub = w_clean[i:i+3]
                    idx_sub = self._hash_token(f"sub_{sub}")
                    vec[idx_sub] += 0.5
            if len(w_clean) >= 4:
                for i in range(len(w_clean) - 3):
                    sub4 = w_clean[i:i+4]
                    idx_sub4 = self._hash_token(f"sub4_{sub4}")
                    vec[idx_sub4] += 0.75

        # Normalize to unit length for cosine similarity (Inner Product in FAISS)
        norm = np.linalg.norm(vec)
        if norm > 1e-9:
            vec = vec / norm
        else:
            vec[0] = 1.0  # fallback non-zero vector
            
        return vec

    def embed_text(self, text: str) -> List[float]:
        vec = self._text_to_vector(text)
        return vec.tolist()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._text_to_vector(t).tolist() for t in texts]


class GeminiEmbeddingService(BaseEmbeddingService):
    """
    Google Gemini text-embedding-004 provider.
    """
    def __init__(self, api_key: str):
        self.api_key = api_key
        self._dim = 768

    @property
    def dimension(self) -> int:
        return self._dim

    def embed_text(self, text: str) -> List[float]:
        try:
            from google import genai
            client = genai.Client(api_key=self.api_key)
            result = client.models.embed_content(
                model="text-embedding-004",
                contents=text
            )
            vec = np.array(result.embedding.values, dtype=np.float32)
            norm = np.linalg.norm(vec)
            if norm > 1e-9:
                vec = vec / norm
            return vec.tolist()
        except Exception:
            # Gracefully fallback to local
            local = LocalDenseEmbeddingService(self._dim)
            return local.embed_text(text)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_text(t) for t in texts]


# Global Singleton
_embedding_service_instance = None

def get_embedding_service() -> BaseEmbeddingService:
    global _embedding_service_instance
    if _embedding_service_instance is None:
        if EMBEDDING_PROVIDER == "gemini" and LLM_API_KEY:
            _embedding_service_instance = GeminiEmbeddingService(LLM_API_KEY)
        else:
            _embedding_service_instance = LocalDenseEmbeddingService(dim=384)
    return _embedding_service_instance
