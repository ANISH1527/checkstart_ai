import hashlib
import json
import logging
from typing import List, Optional, Any
import redis

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingCacheService:
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or getattr(settings, "REDIS_URL", "redis://localhost:6379/0")
        self._redis_client = None

    @property
    def client(self) -> Optional[redis.Redis]:
        if self._redis_client is None and self.redis_url:
            try:
                self._redis_client = redis.Redis.from_url(self.redis_url, decode_responses=True, socket_timeout=1.0)
            except Exception as e:
                logger.warning(f"Failed to initialize Redis client: {e}")
                return None
        return self._redis_client

    def cache_key(self, text: str, prefix: str = "emb:") -> str:
        text_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
        return f"{prefix}{text_hash}"

    def get_hash(self, text: str) -> str:
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    def get(self, text: str) -> Optional[List[float]]:
        try:
            cli = self.client
            if not cli:
                return None
            key = self.cache_key(text, "emb:")
            data = cli.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            logger.warning(f"Redis get failed for embedding cache: {e}")
            return None
        return None

    def set(self, text: str, embedding: List[float], ttl_seconds: int = 86400) -> None:
        try:
            cli = self.client
            if not cli:
                return
            key = self.cache_key(text, "emb:")
            cli.set(key, json.dumps(embedding), ex=ttl_seconds)
        except Exception as e:
            logger.warning(f"Redis set failed for embedding cache: {e}")

    def get_similarity_cache(self, text: str) -> Optional[Any]:
        try:
            cli = self.client
            if not cli:
                return None
            key = self.cache_key(text, "sim:")
            data = cli.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            logger.warning(f"Redis get failed for similarity cache: {e}")
            return None
        return None

    def set_similarity_cache(self, text: str, results: Any, ttl_seconds: int = 3600) -> None:
        try:
            cli = self.client
            if not cli:
                return
            key = self.cache_key(text, "sim:")
            cli.set(key, json.dumps(results), ex=ttl_seconds)
        except Exception as e:
            logger.warning(f"Redis set failed for similarity cache: {e}")

    def incr_counter(self, name: str) -> None:
        try:
            cli = self.client
            if cli:
                cli.incr(name)
        except Exception as e:
            logger.warning(f"Redis INCR failed for {name}: {e}")

    def get_cache_stats(self) -> dict:
        try:
            cli = self.client
            if not cli:
                return {"embedding_hit_rate": "0%", "similarity_hit_rate": "0%"}
            
            emb_hits = int(cli.get("stats:emb:hits") or 0)
            emb_misses = int(cli.get("stats:emb:misses") or 0)
            sim_hits = int(cli.get("stats:sim:hits") or 0)
            sim_misses = int(cli.get("stats:sim:misses") or 0)

            emb_total = emb_hits + emb_misses
            sim_total = sim_hits + sim_misses

            emb_rate = f"{round((emb_hits / emb_total) * 100, 1)}%" if emb_total > 0 else "0%"
            sim_rate = f"{round((sim_hits / sim_total) * 100, 1)}%" if sim_total > 0 else "0%"

            return {
                "embedding_hit_rate": emb_rate,
                "similarity_hit_rate": sim_rate
            }
        except Exception as e:
            logger.warning(f"Failed to fetch cache stats from Redis: {e}")
            return {"embedding_hit_rate": "0%", "similarity_hit_rate": "0%"}
