import pytest
from app.services.verification_service import VerificationService, OverrideItem
from app.services.evidence_service import EvidenceService


def test_layer8_claim_classification_taxonomy():
    """
    Layer 8 must classify claims into FACT, INFERENCE, ASSUMPTION, or UNKNOWN:
    - FACT only if supported by retrieved evidence (Layer 6 benchmark or competitor match)
    - INFERENCE if logically inferred from founder inputs / persona
    - ASSUMPTION if unverified assertion without evidence backing
    - UNKNOWN if missing info / insufficient specification
    """
    svc = VerificationService()
    ev_svc = EvidenceService()

    idea_dict = {
        "title": "EduPath AI Assistant",
        "description": "AI learning assistant for college students to study and pass exams.",
        "target_customer": "Undergraduate engineering students",
        "revenue_model": "$9.99 per month subscription fee",
        "industry": "EdTech"
    }

    evidence_list = ev_svc.fetch_evidence(idea_dict, {"keywords": ["education", "student", "learning"]})
    assert len(evidence_list) > 0
    assert any(e["reliability"] == "VERIFIED" for e in evidence_list)

    llm_output = {
        "claims": [
            {"claim": "Higher education AI learning tools show a 24.8% CAGR adoption growth among university students.", "category": "MARKET"},
            {"claim": "Engineering students experience high exam prep friction and need automated study workflows.", "category": "PROBLEM"},
            {"claim": "EduPath AI will guarantee 100% viral adoption with zero marketing spend across all universities.", "category": "GROWTH"},
            {"claim": "Vague data", "category": "GENERAL"}
        ],
        "strengths": ["Personalized study workflow for engineering students"],
        "weaknesses": ["Requires proof of student retention over semester exams"]
    }

    res = svc.verify(user_input=idea_dict, llm_output=llm_output, evidence_list=evidence_list)
    assert "verified_claims" in res
    claims = res["verified_claims"]
    assert len(claims) >= 4

    classes = [c["claim_class"] for c in claims]
    assert "FACT" in classes
    assert "INFERENCE" in classes
    assert "ASSUMPTION" in classes
    assert "UNKNOWN" in classes

    # Verify FACT is supported by Layer 6 evidence
    fact_claim = next(c for c in claims if c["claim_class"] == "FACT")
    assert "HolonIQ" in fact_claim["evidence_source"] or "Layer 6" in fact_claim["evidence_source"] or "Benchmark" in fact_claim["evidence_source"]
    assert fact_claim["reliability"] == "VERIFIED"


def test_layer8_caps_on_seven_parameters():
    """
    Verify Layer 8 caps on report_v1 params:
    - No revenue model -> revenue_potential <= 4.5
    - Target 'everyone'/vague -> target_customer <= 4.0
    - Impossible/fraud -> all params <= 2.0
    """
    svc = VerificationService()

    # 1. No revenue model
    no_rev_idea = {
        "title": "Notes App",
        "description": "Simple notes app for students without any pricing.",
        "target_customer": "College freshmen living in dorms"
    }
    raw_scores = {"revenue_potential": 8.5, "target_customer": 8.0, "market_demand": 7.5}
    res1 = svc.verify(user_input=no_rev_idea, llm_scores=raw_scores)
    assert res1["verified_scores"]["revenue_potential"] <= 4.5
    assert any(o.get("reason") == "revenue_model_missing_score_capped" for o in res1["overrides_applied"])

    # 2. Vague customer ("everyone in the world")
    vague_idea = {
        "title": "Campus App",
        "description": "An app for everyone in the whole world.",
        "target_customer": "everyone",
        "revenue_model": "$5 subscription fee"
    }
    res2 = svc.verify(user_input=vague_idea, llm_scores={"target_customer": 9.0, "revenue_potential": 7.0})
    assert res2["verified_scores"]["target_customer"] <= 4.0
    assert any("target_customer" in o.get("parameter", "") for o in res2["overrides_applied"])

    # 3. Impossible / fraud
    fraud_idea = {
        "title": "Magic Invisible Water App",
        "description": "Earn crore in one month selling empty bottles with no real water.",
        "target_customer": "everyone"
    }
    res3 = svc.verify(user_input=fraud_idea, llm_scores={
        "market_demand": 9.0, "problem_severity": 8.5, "competition": 9.0,
        "target_customer": 9.5, "innovation": 9.0, "feasibility": 9.0, "revenue_potential": 9.5
    })
    for p in ["market_demand", "problem_severity", "competition", "target_customer", "innovation", "feasibility", "revenue_potential"]:
        assert res3["verified_scores"][p] <= 2.0
    assert any(o.get("reason") == "fraudulent_product_signal_detected" for o in res3["overrides_applied"])


def test_confidence_formula_bounds():
    """Calibrated confidence must stay within 10% - 95%"""
    svc = VerificationService()

    # High quality complete idea
    res_high = svc.verify(
        user_input={"title": "T", "description": "D" * 50, "target_customer": "C" * 30, "revenue_model": "$10/mo"},
        evidence_list=[{"reliability": "VERIFIED", "claim": "Fact"}],
        llm_scores={"market_demand": 8.0}
    )
    assert 10.0 <= res_high["calibrated_confidence"] <= 95.0

    # Terrible fraud idea with critical violations and no evidence
    res_low = svc.verify(
        user_input={"title": "Magic", "description": "earn crore in invisible bottle with no real water"},
        evidence_list=[],
        rule_results=[{"passed": False, "severity": "CRITICAL", "rule": "FRAUD"}]
    )
    assert 10.0 <= res_low["calibrated_confidence"] <= 95.0
    assert res_low["calibrated_confidence"] == 10.0  # Hit minimum floor
