from app.services.similarity_service import SimilarityService


def test_cosine_similarity_calculation():
    sim_service = SimilarityService(threshold=0.85)

    vec_a = [1.0, 0.0, 0.0]
    vec_b = [1.0, 0.0, 0.0]
    vec_c = [0.0, 1.0, 0.0]

    assert sim_service.cosine_similarity(vec_a, vec_b) == 1.0
    assert sim_service.cosine_similarity(vec_a, vec_c) == 0.0
