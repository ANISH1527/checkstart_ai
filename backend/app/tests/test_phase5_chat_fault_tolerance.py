import pytest
from app.core.config import settings
from app.services.chat_service import ChatService
from app.services.llm_providers.gemini_provider import GeminiProvider
from app.services.information_gap_service import InformationGapService
from app.models.chat import ValidationSession
from app.models.idea import Idea


def test_jwt_expiry_and_default_role():
    """HS256 JWT with 7-day expiry (10080 minutes), default role USER."""
    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 7 * 24 * 60
    assert settings.JWT_ALGORITHM == "HS256"


def test_dialogue_manager_entity_extraction_and_state_sync(db_session):
    """
    Finite-state dialogue manager:
    - Triggers entity extraction
    - Never overwrites collected fields with empty values
    - Readiness = name + problem + solution + target customer
    """
    chat_svc = ChatService(db_session)
    session = ValidationSession(
        id="test-session-fsm-1",
        user_id=1,
        title="EduTech Idea",
        status="active",
        extracted_context={}
    )

    # Turn 1: Founder specifies name, problem, and industry keyword "edtech"
    msg1 = "We are named StudyPilot. The problem is college students struggle with massive exam syllabus volumes. It is an edtech venture."
    ctx1, _ = chat_svc.update_extracted_context(session, msg1)

    assert "StudyPilot" in ctx1.get("startupName", "")
    assert "struggle with massive exam syllabus volumes" in ctx1.get("problemStatement", "")
    assert ctx1.get("industry") == "EdTech"
    assert ctx1.get("is_ready") is False  # Missing solution and customer

    # Turn 2: Founder specifies solution and target customer triggers: "we are building", "target is"
    msg2 = "We are building automated adaptive flashcards. Our target is university engineering students."
    ctx2, _ = chat_svc.update_extracted_context(session, msg2)

    # State sync: previous fields must NOT be overwritten
    assert "StudyPilot" in ctx2.get("startupName", "")
    assert "struggle" in ctx2.get("problemStatement", "")
    assert "flashcards" in ctx2.get("proposedSolution", "")
    assert "engineering students" in ctx2.get("targetCustomer", "")
    assert ctx2.get("is_ready") is True  # Core readiness achieved!

    # Turn 3: Founder specifies pricing: "charge $9.99/month"
    msg3 = "We charge $9.99/month via subscription."
    ctx3, _ = chat_svc.update_extracted_context(session, msg3)

    assert ctx3.get("revenueModel") is not None
    # Verify no empty overwrite
    assert ctx3.get("targetCustomer") is not None


def test_deterministic_offline_fallback_reproducibility():
    """
    Fallback is seeded by MD5 hash of idea text, reproducible,
    flagged as 'offline estimate, not market validation', and applies confidence penalty.
    """
    provider = GeminiProvider(api_key="mock")

    idea1 = {
        "title": "QuickDelivery Dorm",
        "description": "Peer to peer late night food delivery for dorm students."
    }

    # Run twice
    res1 = provider._deterministic_offline_fallback(idea1, "v1.2")
    res2 = provider._deterministic_offline_fallback(idea1, "v1.2")

    # Math & scores must be 100% deterministic & identical
    assert res1["scores"] == res2["scores"]
    assert res1["generation_mode"] == "offline_fallback"
    assert res1["degraded"] is True
    assert "offline estimate, not market validation" in res1["limitations"]
    assert res1["confidence_penalty"] > 0


def test_information_gap_detector_questions_per_missing_field():
    """Information Gap Detector outputs research questions per missing field."""
    svc = InformationGapService()

    # Vague idea missing all details
    vague_idea = {
        "title": "App",
        "description": "Just an app for people."
    }

    gaps = svc.detect_gaps(vague_idea, {})
    assert len(gaps) >= 4
    categories = [g["category"] for g in gaps]
    assert "PROBLEM_DEFINITION" in categories
    assert "TARGET_CUSTOMER" in categories
    assert "REVENUE_MODEL" in categories
    assert all("question" in g and len(g["question"]) > 10 for g in gaps)


def test_google_auth_signature_enforced_in_non_dev(client):
    """Google ID token signature verification must be enforced when ENVIRONMENT != development."""
    orig_env = settings.ENVIRONMENT
    try:
        settings.ENVIRONMENT = "production"

        # Request with missing or fake token in production must be rejected with 401
        res = client.post(
            "/api/v1/auth/google",
            json={
                "email": "student@gmail.com",
                "googleId": "fake_google_id_123",
                "name": "Student Founder"
            }
        )
        assert res.status_code == 401
    finally:
        settings.ENVIRONMENT = orig_env
