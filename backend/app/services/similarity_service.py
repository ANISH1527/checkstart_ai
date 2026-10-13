from typing import List, Dict, Any, Tuple, Optional
import math
import re
from app.core.config import settings
from app.services.embedding_cache_service import EmbeddingCacheService

cache_service = EmbeddingCacheService()


class SimilarityResultDict(dict):
    """
    Dictionary return type for similarity results that also supports
    list iteration and slicing for backwards compatibility.
    """
    def __iter__(self):
        return iter(self.get("similar_ideas", []))

    def __getitem__(self, key):
        if isinstance(key, (slice, int)):
            return self.get("similar_ideas", [])[key]
        return super().__getitem__(key)

    def __len__(self):
        return len(self.get("similar_ideas", []))


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

    def _extract_shared_keywords(
        self,
        idea_text: str,
        similar_idea_text: str,
        top_n: int = 5
    ) -> list[str]:
        """
        Find keywords that appear in both idea texts.
        Uses simple word overlap on NLP-extracted tokens.
        Falls back to raw word comparison if NLP is unavailable.
        """
        def tokenize(text: str) -> set[str]:
            words = re.findall(r'\b[a-zA-Z]{4,}\b', (text or "").lower())
            stop_words = {
                "that", "this", "with", "from", "they", "have",
                "will", "your", "about", "which", "when", "were",
                "what", "also", "into", "than", "then", "been",
                "more", "some", "such", "very", "just", "each"
            }
            return {w for w in words if w not in stop_words}

        tokens_a = tokenize(idea_text)
        tokens_b = tokenize(similar_idea_text)
        shared = tokens_a.intersection(tokens_b)

        return sorted(list(shared), key=len, reverse=True)[:top_n]

    def find_similar_ideas(
        self,
        target_vec: List[float],
        candidate_ideas: List[Dict[str, Any]],
        idea_text: Optional[str] = None,
        target_user_id: Optional[int] = None
    ) -> SimilarityResultDict:
        cache_key_text = idea_text or str(target_vec)
        cached_results = cache_service.get_similarity_cache(cache_key_text)
        if cached_results is not None:
            cache_service.incr_counter("stats:sim:hits")
            if isinstance(cached_results, dict):
                return SimilarityResultDict(cached_results)
            return SimilarityResultDict({
                "max_similarity": max((s.get("similarity_score", 0.0) for s in cached_results), default=0.0),
                "similar_ideas": cached_results,
                "recommendation": "UNIQUE"
            })

        cache_service.incr_counter("stats:sim:misses")

        high_thresh = getattr(settings, "SIMILARITY_HIGH_THRESHOLD", 0.85)
        med_thresh = getattr(settings, "SIMILARITY_MED_THRESHOLD", 0.72)

        similar_ideas = []
        for candidate in candidate_ideas:
            cand_vec = candidate.get("embedding")
            if not cand_vec:
                continue
            sim = self.cosine_similarity(target_vec, cand_vec)

            if sim >= high_thresh:
                overlap_level = "HIGH"
            elif sim >= med_thresh:
                overlap_level = "MODERATE"
            else:
                overlap_level = "LOW"

            cand_desc = candidate.get("description", "") or candidate.get("title", "")
            shared_kws = self._extract_shared_keywords(
                idea_text or "",
                cand_desc,
                top_n=5
            )

            cand_user_id = candidate.get("user_id")
            is_same_user = bool(
                target_user_id is not None
                and cand_user_id is not None
                and str(target_user_id) == str(cand_user_id)
            )

            item = {
                "idea_id": candidate.get("id"),
                "id": candidate.get("id"),
                "title": candidate.get("title", ""),
                "similarity_score": round(float(sim), 4),
                "overlap_level": overlap_level,
                "category": overlap_level,
                "shared_keywords": shared_kws,
                "is_same_user": is_same_user
            }
            similar_ideas.append(item)

        # Sort by similarity descending
        similar_ideas.sort(key=lambda x: x["similarity_score"], reverse=True)

        if not similar_ideas:
            recommendation = "UNIQUE"
        elif any(s["overlap_level"] == "HIGH" and not s["is_same_user"] for s in similar_ideas):
            recommendation = "HIGH_OVERLAP"
        elif any(s["overlap_level"] == "MODERATE" for s in similar_ideas):
            recommendation = "MODERATE_OVERLAP"
        else:
            recommendation = "UNIQUE"

        max_sim = max((s["similarity_score"] for s in similar_ideas), default=0.0)
        res = SimilarityResultDict({
            "max_similarity": max_sim,
            "similar_ideas": similar_ideas,
            "recommendation": recommendation
        })

        cache_service.set_similarity_cache(cache_key_text, res, ttl_seconds=3600)
        return res
