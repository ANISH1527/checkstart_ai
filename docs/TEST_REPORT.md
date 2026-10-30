# Test Execution Report: CheckStart AI

**Date:** October 30, 2026  
**Environment:** Python 3.13.5 (Pytest 9.1.1) & Node.js 20.x (Vitest 2.1.8)  
**Database:** SQLite (`test.db`, `startup_validation.db`) with Alembic migrations  
**Target:** Full system verification for Academic Mini-Project Specification ("AI Validation Platform for Student Startup Ideation")

---

## 1. Executive Summary

| Test Suite | Framework | Total Tests | Passed | Failed | Skipped | Pass Rate | Execution Time |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Backend Integration & Unit** | `pytest` | 111 | 111 | 0 | 0 | **100%** | ~240s |
| **Frontend Utilities & Engine** | `vitest` | 75 | 75 | 0 | 0 | **100%** | 888ms |
| **Total System Tests** | - | **186** | **186** | **0** | **0** | **100%** | - |

---

## 2. Backend Pytest Suite Breakdown

The backend test suite spans 18 distinct test modules covering all layers of the validation pipeline, authentication, vector search, and API endpoints.

| Test File | Test Count | Status | Key Coverage Areas |
| :--- | :---: | :---: | :--- |
| `app/tests/test_architectural_tasks.py` | 22 | PASS | Soft/hard delete RBAC, oversized inputs, ownership boundary, background task execution |
| `app/tests/test_auth.py` | 9 | PASS | User registration, TC-02 Student login, password validation, JWT HS256 expiry, Google OAuth verification |
| `app/tests/test_benchmark.py` | 4 | PASS | Industry benchmark retrieval, market data matching, retrieval date metadata |
| `app/tests/test_chat_service.py` | 8 | PASS | 4-step FSM dialogue manager, entity extraction regexes, state sync, instant validation from session |
| `app/tests/test_claim_verification.py` | 3 | PASS | Layer 8 claim taxonomy (FACT, INFERENCE, ASSUMPTION, UNKNOWN), evidence linking |
| `app/tests/test_comparison_and_dashboard.py` | 5 | PASS | Version comparison, per-parameter delta $S_{v2}-S_{v1}$, recommendation completion tracking |
| `app/tests/test_confidence.py` | 1 | PASS | Layer 8 confidence calibration bounds (10% to 95%) |
| `app/tests/test_faiss_similarity.py` | 6 | PASS | 384-dim normalized embeddings, FAISS IndexFlatIP search, disk persistence, DB rebuild, NumPy fallback |
| `app/tests/test_ideas.py` | 1 | PASS | Idea CRUD operations and field persistence |
| `app/tests/test_integration.py` | 4 | PASS | End-to-end idea creation, pipeline execution, report generation, recommendation tracking |
| `app/tests/test_phase4_api.py` | 3 | PASS | Canonical routes (`/ideas/{id}/reports`, `/compare?from=1&to=2`, `/validate`, `/chat`), tenant isolation |
| `app/tests/test_phase5_chat_fault_tolerance.py` | 5 | PASS | 12s LLM timeout, single retry, MD5 deterministic offline fallback flagging, profile endpoints |
| `app/tests/test_pipeline_intelligence.py` | 2 | PASS | Intelligence synthesis, risk-to-recommendation mapping |
| `app/tests/test_recommendation_pipeline.py` | 14 | PASS | Dynamic recommendation generation, root cause mapping, action prioritization |
| `app/tests/test_report_service.py` | 2 | PASS | Executive summary generation, verdict synthesis |
| `app/tests/test_rules.py` | 1 | PASS | Layer 8 cap rules (fraud, vague customer, no revenue model) |
| `app/tests/test_scoring.py` | 14 | PASS | `report_v1` weights sum = 1.0, clamp_score bounds, sample calculation ($86.5\%$), classification rubric |
| `app/tests/test_similarity.py` | 6 | PASS | Duplicate detection thresholding, self-exclusion, competitor overlap |
| `app/tests/test_validation.py` | 1 | PASS | Validation pipeline execution and report structure consistency |
| **Total Backend** | **111** | **PASS** | |

---

## 3. Frontend Vitest Suite Breakdown

| Test File | Test Count | Status | Key Coverage Areas |
| :--- | :---: | :---: | :--- |
| `src/utils/scoreUtils.test.ts` | 75 | PASS | `calculateValidationScore`, `clampScore`, `classifyReportV1`, progress-bar color coding (green/blue/amber/red), legacy v9 backward compatibility |
| **Total Frontend** | **75** | **PASS** | |

---

## 4. Academic Specification Test Cases (TC-01 to TC-10)

As documented in `docs/TEST_CASES.md`, all required academic test cases pass:

| Test Case | Description | Covering Test Function | Result |
| :--- | :--- | :--- | :---: |
| **TC-01** | Student Account Registration | `test_auth.py::test_register_user_success` | **PASS** |
| **TC-02** | Student Login & Token Generation | `test_auth.py::test_tc02_student_login` | **PASS** |
| **TC-03** | Startup Idea Submission & Validation | `test_integration.py::test_full_validation_flow_integration` | **PASS** |
| **TC-04** | 7-Parameter Scoring Calculation & Clamping | `test_scoring.py::test_sample_calculation_and_rounding` | **PASS** |
| **TC-05** | Claim Verification & Taxonomy (Layer 8) | `test_claim_verification.py::test_layer8_claim_taxonomy_and_evidence_linking` | **PASS** |
| **TC-06** | Vector Embedding & Semantic Similarity | `test_faiss_similarity.py::test_faiss_similarity_ranking_and_self_exclusion` | **PASS** |
| **TC-07** | Version Comparison & Recommendation Tracking | `test_phase4_api.py::test_versioning_and_unique_constraint` | **PASS** |
| **TC-08** | Multi-Turn Dialogue & Entity Extraction | `test_phase5_chat_fault_tolerance.py::test_fsm_entity_extraction_and_state_sync` | **PASS** |
| **TC-09** | LLM Fault Tolerance & Deterministic Fallback | `test_phase5_chat_fault_tolerance.py::test_llm_timeout_retry_and_deterministic_fallback` | **PASS** |
| **TC-10** | Tenant Isolation & Authorization Enforcement | `test_phase4_api.py::test_tenant_isolation_and_authorization` | **PASS** |

---

## 5. Verification Verdict

All 186 unit and integration test assertions pass without regression across both backend and frontend suites. System fully conforms with the Phase 6 testing requirements.
