import os
import json
import pytest
import numpy as np
from app.services.embedding_service import EmbeddingService, EXPECTED_DIMENSION
from app.services.faiss_service import FaissVectorService, FAISS_AVAILABLE
from app.services.similarity_service import SimilarityService
from app.services.seed_service import seed_sample_ventures_if_empty, SAMPLE_VENTURES
from app.database.connection import SessionLocal
from app.models.idea import Idea
from app.models.embedding import IdeaEmbedding


def test_embedding_384_dim_and_l2_normalized():
    """Layer 3: all-MiniLM-L6-v2 embeddings must be 384-dim and L2-normalized."""
    emb_svc = EmbeddingService()
    text = "AI learning assistant for college students to study and pass exams."
    vec = emb_svc.generate_embedding(text)

    assert len(vec) == 384
    arr = np.array(vec, dtype=np.float32)
    norm = float(np.linalg.norm(arr))
    assert abs(norm - 1.0) < 1e-4, f"Vector norm {norm} is not unit length (1.0)"


def test_embedding_cache_and_hash_reuse():
    """Embeddings reuse cached vector when idea text hash is unchanged."""
    emb_svc = EmbeddingService()
    text = "Micro-expense splitting and shared utility tracker for college roommates."
    h = emb_svc.cache_service.get_hash(text)

    vec1 = emb_svc.generate_embedding(text)
    vec2 = emb_svc.generate_embedding(text)

    assert vec1 == vec2
    # Verify cached entry exists
    assert emb_svc.cache_service.get(text) is not None


def test_faiss_search_nearest_neighbor_and_backend_report():
    """
    FAISS IndexFlatIP over normalized vectors returns nearest neighbors with cosine similarities.
    Reports backend used ('faiss' or 'numpy').
    """
    test_index_file = "test_temp_faiss.faiss"
    if os.path.exists(test_index_file):
        os.remove(test_index_file)

    service = FaissVectorService(index_path=test_index_file, dimension=384)

    # Create 3 deterministic vectors
    v1 = np.zeros(384, dtype=np.float32)
    v1[0] = 1.0  # Unit vector along axis 0

    v2 = np.zeros(384, dtype=np.float32)
    v2[0] = 0.95
    v2[1] = np.sqrt(1 - 0.95**2)  # Very close to v1 (cos sim ~ 0.95)

    v3 = np.zeros(384, dtype=np.float32)
    v3[10] = 1.0  # Orthogonal to v1 (cos sim = 0.0)

    service.add_vector(idea_id=101, vector=v1.tolist())
    service.add_vector(idea_id=102, vector=v2.tolist())
    service.add_vector(idea_id=103, vector=v3.tolist())

    # Search with v1
    res = service.search(query_vec=v1.tolist(), top_k=3, exclude_idea_id=101)

    assert res["backend_used"] in ["faiss", "numpy"]
    matches = res["similar_ideas"]
    assert len(matches) >= 1
    # 101 must be excluded
    assert all(m["idea_id"] != 101 for m in matches)
    # 102 should be closest match
    assert matches[0]["idea_id"] == 102
    assert matches[0]["similarity_score"] >= 0.90
    assert matches[0]["is_duplicate"] is True  # > 0.85

    # Cleanup
    if os.path.exists(test_index_file):
        os.remove(test_index_file)


def test_self_exclusion_in_similarity_service():
    """Similarity search must exclude the idea itself from its own results."""
    sim_svc = SimilarityService()
    v_base = np.zeros(384, dtype=np.float32)
    v_base[0] = 1.0

    candidates = [
        {"id": 1, "title": "Self Idea", "description": "Same", "user_id": 10, "embedding": v_base.tolist()},
        {"id": 2, "title": "Other Idea", "description": "Other", "user_id": 20, "embedding": v_base.tolist()}
    ]

    res = sim_svc.find_similar_ideas(
        target_vec=v_base.tolist(),
        candidate_ideas=candidates,
        exclude_idea_id=1
    )

    ids = [m["idea_id"] for m in res["similar_ideas"]]
    assert 1 not in ids
    assert 2 in ids


def test_numpy_fallback_when_faiss_unavailable():
    """If FAISS is unavailable or bypassed, numpy cosine dot product behaves identically."""
    service = FaissVectorService(dimension=384)
    service.backend = "numpy"  # Force numpy fallback

    v1 = np.zeros(384, dtype=np.float32)
    v1[0] = 1.0

    candidates = [
        {"id": 201, "title": "Cand 1", "embedding": v1.tolist()},
        {"id": 202, "title": "Cand 2", "embedding": [0.0] * 384}
    ]

    res = service.search(query_vec=v1.tolist(), top_k=2, candidates=candidates)
    assert res["backend_used"] == "numpy"
    assert res["similar_ideas"][0]["idea_id"] == 201
    assert res["similar_ideas"][0]["similarity_score"] == 1.0


def test_sample_ventures_seeding():
    """Sample ventures dataset is seeded with clearly marked sample data."""
    with SessionLocal() as db:
        seed_sample_ventures_if_empty(db)
        samples = db.query(Idea).filter(Idea.title.contains("[SAMPLE]")).all()
        assert len(samples) >= len(SAMPLE_VENTURES)
        for s in samples:
            assert "[SAMPLE" in s.title or "[SAMPLE" in s.description
            # Check embedding exists
            embs = db.query(IdeaEmbedding).filter(IdeaEmbedding.idea_id == s.id).all()
            assert len(embs) > 0
