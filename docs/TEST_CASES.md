# CheckStart AI — Test Case Specifications (TC-01 to TC-10)

This document formalizes the validation and verification test cases corresponding to the academic report specifications for the **CheckStart AI: AI Validation Platform for Student Startup Ideation**.

Each test case specifies the feature under test, pre-conditions, test procedure, expected output, and the exact automated test function verifying it in the test suite.

---

| Test ID | Test Case Name | Target Component | Spec Requirement | Automated Test Function | Status |
|---|---|---|---|---|---|
| **TC-01** | Student Founder Registration | Auth API (`/api/v1/auth/register`) | Register user with name, email, password; verify bcrypt hash, default role `USER`, HTTP 201 Created. | `backend/app/tests/test_auth.py::test_register_user` | **PASSED** |
| **TC-02** | Student Login & Token Issuance | Auth API (`/api/v1/auth/login`) | Authenticate valid student credentials, return 7-day HS256 JWT access token, verify payload subject and bearer type. | `backend/app/tests/test_auth.py::test_tc02_student_login` | **PASSED** |
| **TC-03** | Invalid Password / Auth Rejection | Auth API (`/api/v1/auth/login`) | Reject invalid passwords with HTTP 401 Unauthorized and explicit error message; prevent unauthorized token issue. | `backend/app/tests/test_auth.py::test_login_invalid_password_returns_specific_error` | **PASSED** |
| **TC-04** | Multi-Tenant Idea Isolation | Ideas API (`/api/v1/ideas/*`) | Enforce strict tenant ownership. User B attempting to read, validate, or compare User A's proprietary idea receives HTTP 404. | `backend/app/tests/test_phase4_api.py::test_tenant_authorization_isolation` | **PASSED** |
| **TC-05** | 7-Parameter Scoring Engine (`report_v1`) | Scoring Engine (`scoring_service.py`) | Weights sum to exactly 1.0 (asserted at import). Boundary checks (all 1.0 $\to 10.0\%$, all 10.0 $\to 100.0\%$, NaN/None $\to 5.0$). Sample calc (8.5, 8.4, 8.1, 9.7, 9.4, 7.9, 9.3 $\to 8.65 \to 86.5\%$). LLM never supplies overall score directly. | `backend/app/tests/test_scoring.py::test_report_v1_sample_calculation`<br>`backend/app/tests/test_scoring.py::test_report_v1_weights_sum_to_one`<br>`backend/app/tests/test_scoring.py::test_report_v1_boundary_scores` | **PASSED** |
| **TC-06** | Layer 8 Caps & Claim Taxonomy | Verification Layer (`verification_service.py`) | No revenue model $\to \text{revenue\_potential} \le 4.5$; vague customer $\to \text{target\_customer} \le 4.0$; fraud $\to$ all params $\le 2.0$. Claims classified strictly into `FACT`, `INFERENCE`, `ASSUMPTION`, `UNKNOWN`. Calibrated confidence bounded to [10.0%, 95.0%]. | `backend/app/tests/test_claim_verification.py::test_layer8_caps_on_seven_parameters`<br>`backend/app/tests/test_claim_verification.py::test_layer8_claim_classification_taxonomy`<br>`backend/app/tests/test_claim_verification.py::test_confidence_formula_bounds` | **PASSED** |
| **TC-07** | FAISS Vector Search & Self-Exclusion | Similarity Engine (`faiss_service.py`, `similarity_service.py`) | 384-dimensional dense vectors normalized to unit length ($\|v\|_2 = 1.0$). `faiss.IndexFlatIP` computes inner product cosine similarity. Persists to disk (`vector_index.faiss`) and rebuilds from DB. Query idea excluded from its own nearest-neighbor results. Duplicate threshold flags high overlap. | `backend/app/tests/test_faiss_similarity.py::test_embedding_384_dim_and_l2_normalized`<br>`backend/app/tests/test_faiss_similarity.py::test_faiss_search_nearest_neighbor_and_backend_report`<br>`backend/app/tests/test_faiss_similarity.py::test_self_exclusion_in_similarity_service` | **PASSED** |
| **TC-08** | Versioning & Parameter Delta Math | Comparison API (`/api/v1/ideas/{id}/compare`) | Re-validation creates new row with incremented version. Enforces `UNIQUE(idea_id, version)` constraint. Calculates per-parameter delta ($S_{v2} - S_{v1}$), overall score delta, confidence delta, reasons for change, and tracks recommendation completion status. | `backend/app/tests/test_phase4_api.py::test_versioning_and_unique_constraint` | **PASSED** |
| **TC-09** | LLM Fault Tolerance & Offline Fallback | LLM Provider (`gemini_provider.py`) | 12-second timeout on LLM call with 1 retry before fallback. Deterministic fallback seeded by MD5 hash of idea text is 100% reproducible, applies confidence penalty, and flags response as "offline estimate, not market validation". | `backend/app/tests/test_phase5_chat_fault_tolerance.py::test_deterministic_offline_fallback_reproducibility` | **PASSED** |
| **TC-10** | FSM Dialogue Manager & Entity Extraction | Chat Engine (`chat_service.py`) | 4-step FSM (context assembly, entity extraction, state sync, completeness audit). Triggers for target customer, problem, solution, revenue model, and industry keywords. State sync never overwrites collected fields with empty values. Readiness = name + problem + solution + target customer. | `backend/app/tests/test_phase5_chat_fault_tolerance.py::test_dialogue_manager_entity_extraction_and_state_sync` | **PASSED** |

---

## Detailed Test Case Execution Procedures

### TC-01: Student Founder Registration
- **Pre-conditions**: Database tables initialized; user email does not exist in `users`.
- **Input**: `POST /api/v1/auth/register` with `name`, `email`, `password`.
- **Expected Result**: HTTP 201 Created, `password_hash` computed with bcrypt, `role` defaulted to `USER`.
- **Test**: `backend/app/tests/test_auth.py::test_register_user`

### TC-02: Student Founder Login
- **Pre-conditions**: User registered with credentials.
- **Input**: `POST /api/v1/auth/login` with `username` (email) and `password`.
- **Expected Result**: HTTP 200 OK, returns `access_token` signed with HS256, 7-day expiration (10080 minutes), bearer token format.
- **Test**: `backend/app/tests/test_auth.py::test_tc02_student_login`

### TC-03: Invalid Credentials Rejection
- **Pre-conditions**: Registered account.
- **Input**: `POST /api/v1/auth/login` with incorrect password.
- **Expected Result**: HTTP 401 Unauthorized, message indicating incorrect credentials.
- **Test**: `backend/app/tests/test_auth.py::test_login_invalid_password_returns_specific_error`

### TC-04: Multi-Tenant Idea Isolation
- **Pre-conditions**: User A owns idea $A_1$. User B authenticates separately.
- **Input**: User B calls `GET /api/v1/ideas/{A1_id}`, `GET /api/v1/ideas/{A1_id}/reports`, `POST /api/v1/ideas/{A1_id}/validate`, `GET /api/v1/ideas/{A1_id}/compare`.
- **Expected Result**: All requests return HTTP 404 Not Found to prevent data leakage.
- **Test**: `backend/app/tests/test_phase4_api.py::test_tenant_authorization_isolation`

### TC-05: 7-Parameter Scoring Engine
- **Pre-conditions**: `report_v1` framework imported.
- **Input**: 7 parameter scores $(8.5, 8.4, 8.1, 9.7, 9.4, 7.9, 9.3)$.
- **Expected Result**: Sum of weights $= 1.0$. Overall score $S = 8.65$, percentage $V = 86.5\%$. Boundary scores all $1.0 \to 10.0\%$, all $10.0 \to 100.0\%$. NaN clamped to $5.0$.
- **Test**: `backend/app/tests/test_scoring.py`

### TC-06: Layer 8 Guardrail Caps & Claim Classification
- **Pre-conditions**: Idea profile with unverified or missing revenue / target customer.
- **Input**: Raw LLM scores with missing revenue model.
- **Expected Result**: `revenue_potential` clamped to $\le 4.5$. Vague customer clamped to $\le 4.0$. Fraud clamped to $\le 2.0$. Claims classified into `FACT`, `INFERENCE`, `ASSUMPTION`, `UNKNOWN`.
- **Test**: `backend/app/tests/test_claim_verification.py`

### TC-07: FAISS Vector Search & Self-Exclusion
- **Pre-conditions**: `faiss.IndexFlatIP` initialized over 384-dimensional embeddings.
- **Input**: Query vector with candidate ideas including query idea itself.
- **Expected Result**: Nearest cosine neighbor returned; query idea excluded from results; `backend_used` reported as `"faiss"`.
- **Test**: `backend/app/tests/test_faiss_similarity.py`

### TC-08: Versioning & Parameter Delta Math
- **Pre-conditions**: Idea has v1 and v2 validation results.
- **Input**: `GET /api/v1/ideas/{id}/compare?from=1&to=2`.
- **Expected Result**: Delta per parameter $(S_{v2} - S_{v1})$, overall delta, confidence delta, reasons for change, and completion status of v1 recommendations. `UNIQUE(idea_id, version)` enforced.
- **Test**: `backend/app/tests/test_phase4_api.py::test_versioning_and_unique_constraint`

### TC-09: LLM Fault Tolerance & Offline Fallback
- **Pre-conditions**: Simulated LLM timeout / offline environment.
- **Input**: `generate_validation_analysis` under timeout or mock key.
- **Expected Result**: Deterministic MD5-seeded fallback result, reproducible across executions, flagged as `"offline estimate, not market validation"`, confidence penalty applied.
- **Test**: `backend/app/tests/test_phase5_chat_fault_tolerance.py::test_deterministic_offline_fallback_reproducibility`

### TC-10: FSM Dialogue Manager & Entity Extraction
- **Pre-conditions**: Active validation conversation session.
- **Input**: Multi-turn dialogue messages with entity triggers.
- **Expected Result**: Target customer, problem, solution, revenue model extracted. State sync preserves non-empty fields. `is_ready` set to `True` when name, problem, solution, and target customer are present.
- **Test**: `backend/app/tests/test_phase5_chat_fault_tolerance.py::test_dialogue_manager_entity_extraction_and_state_sync`
