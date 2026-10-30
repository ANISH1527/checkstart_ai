import os
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
import numpy as np

_faiss_import_error = None
try:
    import faiss
    FAISS_AVAILABLE = True
except Exception as e:
    faiss = None
    FAISS_AVAILABLE = False
    _faiss_import_error = str(e)

logger = logging.getLogger(__name__)

INDEX_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "vector_index.faiss")
DIMENSION = 384
DUPLICATE_THRESHOLD = 0.85


class FaissVectorService:
    def __init__(self, index_path: str = INDEX_FILE_PATH, dimension: int = DIMENSION):
        self.index_path = index_path
        self.dimension = dimension
        self.backend = "faiss" if FAISS_AVAILABLE else "numpy"
        self.index = None
        self._init_index()

    def _init_index(self):
        if not FAISS_AVAILABLE:
            self.backend = "numpy"
            logger.info(f"FAISS not installed/available ({_faiss_import_error}); using numpy vector cosine fallback.")
            return

        try:
            if os.path.exists(self.index_path) and os.path.getsize(self.index_path) > 0:
                self.index = faiss.read_index(self.index_path)
                logger.info(f"Loaded FAISS index from {self.index_path} with {self.index.ntotal} vectors.")
            else:
                base_index = faiss.IndexFlatIP(self.dimension)
                self.index = faiss.IndexIDMap2(base_index)
                logger.info("Initialized new FAISS IndexIDMap2(IndexFlatIP(384)).")
            self.backend = "faiss"
        except Exception as e:
            logger.error(f"Error initializing FAISS index: {e}. Falling back to numpy.")
            base_index = faiss.IndexFlatIP(self.dimension)
            self.index = faiss.IndexIDMap2(base_index)
            self.backend = "numpy"

    def persist_index(self):
        if FAISS_AVAILABLE and self.index is not None:
            try:
                faiss.write_index(self.index, self.index_path)
                logger.debug(f"Persisted FAISS index to {self.index_path}")
            except Exception as e:
                logger.error(f"Failed to persist FAISS index: {e}")

    def rebuild_from_db(self, db_session):
        """
        Rebuilds the FAISS index from the database idea_embeddings table.
        """
        from app.models.embedding import IdeaEmbedding

        logger.info("Rebuilding vector index from idea_embeddings table...")
        if FAISS_AVAILABLE:
            base_index = faiss.IndexFlatIP(self.dimension)
            self.index = faiss.IndexIDMap2(base_index)

        try:
            embeddings = db_session.query(IdeaEmbedding).filter(IdeaEmbedding.idea_id.isnot(None)).all()
            added_count = 0
            for emb in embeddings:
                if not emb.vector or not emb.idea_id:
                    continue
                try:
                    vec = json.loads(emb.vector)
                    if len(vec) == self.dimension:
                        self.add_vector(emb.idea_id, vec, persist=False)
                        added_count += 1
                except Exception as ex:
                    logger.warning(f"Skipping corrupt vector for idea {emb.idea_id}: {ex}")

            self.persist_index()
            logger.info(f"Successfully rebuilt vector index with {added_count} entries from DB.")
        except Exception as e:
            logger.error(f"Error rebuilding vector index from DB: {e}")

    def add_vector(self, idea_id: int, vector: List[float], persist: bool = True):
        """
        Add or update an L2-normalized vector in the index for a given idea_id.
        """
        if not FAISS_AVAILABLE or self.index is None:
            return

        try:
            arr = np.array([vector], dtype=np.float32)
            norm = np.linalg.norm(arr)
            if norm > 0:
                arr = arr / norm

            id_arr = np.array([idea_id], dtype=np.int64)

            # If index already contains this idea_id, remove first
            try:
                self.index.remove_ids(id_arr)
            except Exception:
                pass

            self.index.add_with_ids(arr, id_arr)
            if persist:
                self.persist_index()
        except Exception as e:
            logger.error(f"Failed to add vector for idea {idea_id} to FAISS index: {e}")

    def search(
        self,
        query_vec: List[float],
        top_k: int = 5,
        exclude_idea_id: Optional[int] = None,
        candidates: Optional[List[Dict[str, Any]]] = None,
        duplicate_threshold: float = DUPLICATE_THRESHOLD,
        db_session=None
    ) -> Dict[str, Any]:
        """
        Searches nearest neighbors using FAISS (IndexFlatIP cosine similarity).
        Falls back to numpy cosine if FAISS is unavailable or encounters an error.
        Excludes exclude_idea_id, returns top-k, and flags duplicates.
        """
        # Ensure query vector is L2 normalized
        q_arr = np.array([query_vec], dtype=np.float32)
        q_norm = np.linalg.norm(q_arr)
        if q_norm > 0:
            q_arr = q_arr / q_norm

        backend_used = self.backend
        similar_matches = []

        cand_id_map = None
        if candidates is not None:
            cand_id_map = {c.get("id"): c for c in candidates if c.get("id") is not None}
            cand_id_map.update({c.get("idea_id"): c for c in candidates if c.get("idea_id") is not None})

        if self.backend == "faiss" and self.index is not None and self.index.ntotal > 0:
            try:
                k_search = min(top_k + (1 if exclude_idea_id is not None else 0) + 10, self.index.ntotal)
                distances, ids = self.index.search(q_arr, k_search)

                for dist, match_id in zip(distances[0], ids[0]):
                    if match_id == -1:
                        continue
                    if exclude_idea_id is not None and int(match_id) == int(exclude_idea_id):
                        continue
                    if cand_id_map is not None and int(match_id) not in cand_id_map:
                        continue

                    sim_score = round(float(dist), 4)
                    is_dup = sim_score >= duplicate_threshold

                    match_info = {
                        "idea_id": int(match_id),
                        "id": int(match_id),
                        "similarity_score": sim_score,
                        "is_duplicate": is_dup,
                        "overlap_level": "HIGH" if sim_score >= 0.85 else ("MODERATE" if sim_score >= 0.72 else "LOW")
                    }

                    # Fetch idea details if candidates or db_session available
                    if cand_id_map and int(match_id) in cand_id_map:
                        cand = cand_id_map[int(match_id)]
                        match_info["title"] = cand.get("title", "")
                        match_info["description"] = cand.get("description", "")
                        match_info["user_id"] = cand.get("user_id")
                    elif db_session is not None:
                        from app.models.idea import Idea
                        idea_row = db_session.query(Idea).filter(Idea.id == match_id).first()
                        if idea_row:
                            match_info["title"] = idea_row.title
                            match_info["description"] = idea_row.description
                            match_info["user_id"] = idea_row.user_id

                    similar_matches.append(match_info)
                    if len(similar_matches) >= top_k:
                        break

                backend_used = "faiss"
            except Exception as e:
                logger.error(f"FAISS search failed ({e}). Falling back to numpy.")
                backend_used = "numpy"

        # NumPy fallback if FAISS was not used or yielded 0 results with candidates present
        if backend_used == "numpy" or (len(similar_matches) == 0 and candidates):
            backend_used = "numpy"
            similar_matches = []
            if candidates:
                cand_list = [c for c in candidates if exclude_idea_id is None or c.get("id") != exclude_idea_id]
                for c in cand_list:
                    cand_vec = c.get("embedding")
                    if not cand_vec:
                        continue
                    c_arr = np.array(cand_vec, dtype=np.float32)
                    c_norm = np.linalg.norm(c_arr)
                    if c_norm > 0:
                        c_arr = c_arr / c_norm
                    sim = float(np.dot(q_arr[0], c_arr))
                    sim_score = round(sim, 4)
                    is_dup = sim_score >= duplicate_threshold

                    similar_matches.append({
                        "idea_id": c.get("id"),
                        "id": c.get("id"),
                        "title": c.get("title", ""),
                        "description": c.get("description", ""),
                        "user_id": c.get("user_id"),
                        "similarity_score": sim_score,
                        "is_duplicate": is_dup,
                        "overlap_level": "HIGH" if sim_score >= 0.85 else ("MODERATE" if sim_score >= 0.72 else "LOW")
                    })

                similar_matches.sort(key=lambda x: x["similarity_score"], reverse=True)
                similar_matches = similar_matches[:top_k]

        max_sim = max((s["similarity_score"] for s in similar_matches), default=0.0)
        has_duplicates = any(s.get("is_duplicate", False) for s in similar_matches)

        return {
            "backend_used": backend_used,
            "max_similarity": max_sim,
            "has_duplicates": has_duplicates,
            "similar_ideas": similar_matches,
            "recommendation": "HIGH_OVERLAP" if max_sim >= 0.85 else ("MODERATE_OVERLAP" if max_sim >= 0.72 else "UNIQUE")
        }


# Global singleton instance
faiss_service = FaissVectorService()
