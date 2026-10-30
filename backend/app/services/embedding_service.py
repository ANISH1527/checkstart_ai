import json
import os
from typing import List, Optional
import numpy as np
from app.core.config import settings
from app.core.logging import logger, struct_logger
from app.services.embedding_cache_service import EmbeddingCacheService

EMBEDDING_MODEL_VERSION = "all-MiniLM-L6-v2-v1.0"
EXPECTED_DIMENSION = 384

_model_instance = None


def get_embedding_model():
    global _model_instance
    if _model_instance is None:
        if os.environ.get("TESTING") == "1":
            _model_instance = "MOCK"
            return _model_instance
        try:
            from sentence_transformers import SentenceTransformer
            _model_instance = SentenceTransformer(settings.EMBEDDING_MODEL)
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer ({e}). Using mock embedding fallback.")
            _model_instance = "MOCK"
    return _model_instance


cache_service = EmbeddingCacheService()


class EmbeddingService:
    EMBEDDING_MODEL_VERSION = EMBEDDING_MODEL_VERSION
    EXPECTED_DIMENSION = EXPECTED_DIMENSION

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL
        self.cache_service = cache_service

    def generate_embedding(self, text: str, idea_id: Optional[int] = None, db=None) -> List[float]:
        text_hash = cache_service.get_hash(text)
        cached_vec = cache_service.get(text)
        if cached_vec is not None and len(cached_vec) == EXPECTED_DIMENSION:
            cache_service.incr_counter("stats:emb:hits")
            struct_logger.info("embedding_cache_hit", text_hash=text_hash, idea_id=idea_id)
            return cached_vec

        # Check DB idea_embeddings table for identical text_hash
        if db is not None:
            try:
                from app.models.embedding import IdeaEmbedding
                existing = db.query(IdeaEmbedding).filter(IdeaEmbedding.text_hash == text_hash).first()
                if existing and existing.vector:
                    vec = json.loads(existing.vector)
                    if len(vec) == EXPECTED_DIMENSION:
                        cache_service.set(text, vec, ttl_seconds=86400)
                        return vec
            except Exception as e:
                logger.warning(f"Failed to query idea_embeddings cache: {e}")

        cache_service.incr_counter("stats:emb:misses")
        struct_logger.info("embedding_cache_miss", text_hash=text_hash, idea_id=idea_id)

        vec = self._compute_embedding(text)
        if len(vec) != EXPECTED_DIMENSION:
            raise ValueError(
                f"Embedding dimension mismatch: expected {EXPECTED_DIMENSION}, "
                f"got {len(vec)}. Model may have changed unexpectedly."
            )

        cache_service.set(text, vec, ttl_seconds=86400)
        return vec

    def get_idea_embedding(self, text: str, db=None) -> List[float]:
        return self.generate_embedding(text, db=db)

    def _compute_embedding(self, text: str) -> List[float]:
        model = get_embedding_model()
        if model != "MOCK":
            try:
                vec = model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
                arr = np.array(vec, dtype=np.float32).flatten()
                norm = float(np.linalg.norm(arr))
                if norm > 0:
                    arr = arr / norm
                return arr.tolist()
            except Exception as e:
                logger.error(f"Error generating embedding with sentence-transformers: {e}")

        # Deterministic mock pseudo-embedding (dimension 384 for testing)
        text_len = len(text)
        extended_text = (text * (EXPECTED_DIMENSION // max(1, len(text)) + 2))
        pseudo_vec = [((ord(char) + i + text_len) % 100) / 100.0 for i, char in enumerate(extended_text[:EXPECTED_DIMENSION])]
        while len(pseudo_vec) < EXPECTED_DIMENSION:
            pseudo_vec.append(0.1)
        pseudo_vec = pseudo_vec[:EXPECTED_DIMENSION]

        arr = np.array(pseudo_vec, dtype=np.float32)
        norm = float(np.linalg.norm(arr))
        if norm > 0:
            arr = arr / norm
        return arr.tolist()

    def serialize_embedding(self, embedding: List[float]) -> str:
        return json.dumps(embedding)

    def deserialize_embedding(self, serialized: str) -> List[float]:
        return json.loads(serialized)
