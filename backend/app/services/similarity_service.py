from typing import List, Dict, Any, Tuple, Optional
import math
from app.core.config import settings
from app.services.embedding_cache_service import EmbeddingCacheService

cache_service = EmbeddingCacheService()


class SimilarityService:
    def __init__(self, threshold: float = settings.SIMILARITY_THRESHOLD):
        self.threshold = threshold

    def cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        if not vec_a or not vec_b:
            return 0.0
        min_len = min(len(vec_a), len(vec_b))
        dot_product = sum(vec_a[i] * vec_b[i] for i in range(min_len))
        norm_a = math.sqrt(sum(vec_a[i] ** 2 for i in range(min_len)))
        norm_b = math.sqrt(sum(vec_b[i] ** 2 for i in range(min_len)))
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return dot_product / (norm_a * norm_b)

    def find_similar_ideas(
        self,
        target_vec: List[float],
        candidate_ideas: List[Dict[str, Any]],
        idea_text: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        cache_key_text = idea_text or str(target_vec)
        cached_results = cache_service.get_similarity_cache(cache_key_text)
        if cached_results is not None:
            cache_service.incr_counter("stats:sim:hits")
            return cached_results

        cache_service.incr_counter("stats:sim:misses")

        results = []
        for candidate in candidate_ideas:
            cand_vec = candidate.get("embedding")
            if not cand_vec:
                continue
            sim = self.cosine_similarity(target_vec, cand_vec)
            
            # Map score ranges to semantic categorization
            category = "LOW"
            if sim >= self.threshold:
                category = "HIGH"
            elif sim >= 0.70:
                category = "MODERATE"

            results.append({
                "idea_id": candidate.get("id"),
                "title": candidate.get("title"),
                "similarity_score": round(sim, 4),
                "category": category
            })

        results.sort(key=lambda x: x["similarity_score"], reverse=True)

        cache_service.set_similarity_cache(cache_key_text, results, ttl_seconds=3600)
        return results

