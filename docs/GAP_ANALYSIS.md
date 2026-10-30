# CheckStart AI — System Gap Analysis

**Project**: *CheckStart AI: AI-Assisted Startup Idea Validation and Strategic Recommendation Platform*  
**Date**: October 30, 2026  
**Audited Target**: Academic Project Report Specification vs. Repository Implementation  
**Status Key**:
- **DONE**: Fully implemented, tested, and adhering to the academic report specification.
- **PARTIAL**: Partially implemented or using legacy 9-dimension / alternative structure; requires adaptation.
- **MISSING**: Not present in codebase; requires complete implementation.

---

## Executive Summary

The CheckStart AI codebase contains a substantial foundation built on React 18, TypeScript, Tailwind CSS, FastAPI, SQLAlchemy 2, and Alembic. The backend architecture features a 15-layer sequential pipeline, embedding extraction using SentenceTransformers (`all-MiniLM-L6-v2`), and heuristic fallback evaluation. However, the system currently operates on the legacy 9-dimension viability framework (`legacy_v9`) with 0–100 backend score scaling and 1.0–10.0 rollup, rather than the primary academic report's authoritative 7-parameter engine (`report_v1`).

This Gap Analysis provides a comprehensive, item-by-item audit of each project phase prior to implementation.

---

## Detailed Gap Analysis by Phase

### Phase 1: 7-Parameter Scoring Engine (`report_v1`)

| Spec Item | Status | Existing File Paths | Gap & Required Modifications |
| :--- | :---: | :--- | :--- |
| **7-Parameter Weights & Scale (1.0–10.0)**<br>• `market_demand` (0.25)<br>• `problem_severity` (0.20)<br>• `competition` (0.15)<br>• `target_customer` (0.10)<br>• `innovation` (0.10)<br>• `feasibility` (0.10)<br>• `revenue_potential` (0.10)<br>Sum = exactly 1.0 (assert at import time) | **PARTIAL** | `backend/app/services/scoring_service.py` | Current engine uses 9 dimensions (`market_demand` 0.25, `problem_solution_fit` 0.20, `target_customer_clarity` 0.10, `competition` 0.10, `uniqueness_innovation` 0.10, `technical_feasibility` 0.10, `business_potential` 0.10, `scalability` 0.03, `risk_level` 0.02). Must preserve legacy as `legacy_v9` and introduce `report_v1` with the exact 7 parameters, asserting $\sum W_i = 1.0$ at module import. |
| **Viability Score Formula**<br>$S = \sum (W_i \times S_i)$ rounded to 1 decimal;<br>$V = S \times 10$ (percentage);<br>`calculate_validation_score(scores) -> round(sum(...) * 10, 2)` | **MISSING** | `backend/app/services/scoring_service.py` | Function `calculate_validation_score` does not exist. Existing backend uses raw 0–100 integer/float sums with inverted risk calculation. |
| **Score Clamping (`clamp_score`)**<br>`NaN` or `None` $\to 5.0$, else $\min(10, \max(1, \text{round}(x, 1)))$. LLM scores always pass through it; LLM never supplies overall score. | **PARTIAL** | `backend/app/services/scoring_service.py`, `frontend/src/utils/scoreUtils.ts` | Frontend has `normaliseScore`, but backend lacks explicit `clamp_score(x)` function enforcing $1.0 \le x \le 10.0$ with $5.0$ fallback for NaN/None. |
| **Classification Rubric (`report_v1`)**<br>• 80.0–100.0: Highly Promising ("Build MVP and recruit beta users")<br>• 60.0–79.9: Promising ("Conduct 10-15 customer interviews")<br>• 40.0–59.9: Needs Improvement ("Execute a structured concept pivot")<br>• 0.0–39.9: High Risk ("Pause development and conduct exploratory research")<br>*(Min attainable score is 10.0%)* | **PARTIAL** | `backend/app/services/scoring_service.py` | Current implementation uses 5 legacy bands (`EXCEPTIONAL` $\ge 90$, `STRONG` $\ge 75$, `MODERATE` $\ge 60$, `WEAK` $\ge 40$, `VERY_WEAK` $<40$). Must implement the 4 report tiers with specified recommendations. |
| **Layer 8 Caps Mapped to New Params**<br>• No revenue model $\to \text{revenue\_potential} \le 4.5$<br>• Target "everyone" / vague $\to \text{target\_customer} \le 4.0$<br>• Impossible / fraud $\to \text{all params} \le 2.0$<br>Overrides logged and shown in report | **PARTIAL** | `backend/app/services/verification_service.py`, `backend/app/services/validation_service.py` | Current Layer 8 enforces 100-point caps (`business_potential` $\le 45$, `target_customer_clarity` $\le 40$, fraud $\le 15$). Must map onto the 1.0–10.0 scale parameters for `report_v1`. |
| **Framework Version Storage**<br>Store framework name (`report_v1` vs `legacy_v9`) and version on every validation result. | **PARTIAL** | `backend/app/models/validation.py` | Model has `framework_version` (string default `"v1.0"`), but lacks explicit `framework_name` column to discriminate `report_v1` from `legacy_v9`. |
| **Frontend 7-Param Direct Visualization**<br>Direct 7-parameter radar and cards (no rollup for `report_v1`). Progress-bar colours: $\ge 8.0$ green, 6.0–7.9 blue, 4.0–5.9 amber, $<4.0$ red. | **PARTIAL** | `frontend/src/components/ParameterProgress.tsx`, `frontend/src/components/RadarChartWidget.tsx`, `frontend/src/pages/ReportResultPage.tsx` | Components currently use fallback aliases to map backend 9-dimension scores. Need direct 7-parameter mapping when `framework_name === 'report_v1'` with color thresholds. |

---

### Phase 2: Layer 8 Claim Verification + Layer 6 Evidence

| Spec Item | Status | Existing File Paths | Gap & Required Modifications |
| :--- | :---: | :--- | :--- |
| **Layer 8 Claim Taxonomy**<br>Classify each LLM claim as `FACT`, `INFERENCE`, `ASSUMPTION`, or `UNKNOWN`. `FACT` only if backed by retrieved evidence or competitor match; missing info $\to$ `UNKNOWN`. | **MISSING** | `backend/app/services/verification_service.py` | Layer 8 only performs numeric score caps. No textual claim extraction or 4-tier claim classification taxonomy exists. |
| **Claim Persistence & Evidence Section**<br>Persist claims with class and evidence source; render in report with visual badges and "Evidence & Verification" section. | **MISSING** | `backend/app/models/evidence.py`, `backend/app/api/reports.py`, `frontend/src/pages/ReportResultPage.tsx` | Database model `Evidence` stores raw source URL and claim strings, but lacks claim classification field and linkage to report UI section. |
| **Evidence Origin & Retrieval Date Labeling**<br>Label every source with origin and retrieval date; do not display unverified numbers as verified. | **PARTIAL** | `backend/app/services/evidence_service.py` | Evidence service attaches basic metadata, but benchmark retrieval lacks origin provenance and verification status labeling. |

---

### Phase 3: Real FAISS Search + Embeddings Table

| Spec Item | Status | Existing File Paths | Gap & Required Modifications |
| :--- | :---: | :--- | :--- |
| **Layer 3: Vector Embeddings**<br>`all-MiniLM-L6-v2`, L2-normalised 384-dimensional dense vectors. | **PARTIAL** | `backend/app/services/embedding_service.py` | Embedding service generates 384-dim vectors via SentenceTransformers, but does not explicitly enforce unit $L_2$ normalization on real model vectors. |
| **Layer 4: Real FAISS Search**<br>`faiss.IndexFlatIP` over normalized vectors (inner product = cosine similarity). Persist index to disk (`vector_index.faiss`) and rebuild from DB on startup. Fall back to NumPy cosine if FAISS fails; report backend used. | **MISSING** | `backend/app/services/similarity_service.py` | Current similarity search uses pure Python iteration over in-memory list with Euclidean math. No FAISS indexing or disk persistence exists. |
| **`idea_embeddings` Database Table**<br>`idea_embeddings(idea_id, version, model_name, vector, created_at)`. Reuse cached vectors when idea text hash is unchanged. | **PARTIAL** | `backend/app/models/embedding.py` | Existing table is named `embeddings` with columns `(id, idea_id, model_name, vector_reference, created_at)`. Must migrate to canonical `idea_embeddings` with `version` and raw binary or JSON vector column. |
| **Self-Exclusion & Duplicate Detection**<br>Exclude the idea itself from search results; return top-$k$ with similarity scores; flag likely duplicates above configurable threshold. | **PARTIAL** | `backend/app/services/similarity_service.py` | Basic threshold comparison exists, but self-exclusion by ID is not strictly guaranteed in all pipeline calls. |
| **Sample-Ventures Seed Dataset**<br>Seed small sample-ventures dataset (clearly marked as sample data) for meaningful search on fresh database. | **MISSING** | `backend/app/services/seed_data.py` | No seed script exists for populating baseline competitor / venture vectors into a newly initialized database. |

---

### Phase 4: Data Model, Versioning, and API

| Spec Item | Status | Existing File Paths | Gap & Required Modifications |
| :--- | :---: | :--- | :--- |
| **Required Schema Additions**<br>• `report_analyses` (strengths, weaknesses, risks[severity, mitigation], recommendations[status OPEN\|COMPLETED], evidence JSON)<br>• `audit_logs` (event, metadata, duration_ms, user_id, idea_id)<br>• `idea_embeddings` (above) | **PARTIAL** | `backend/app/models/` | `report_analyses` table is missing. `audit_logs` exists but lacks `duration_ms`, `user_id`, and `idea_id` direct foreign keys. |
| **`validation_results` Fields**<br>`version`, `previous_report_id`, 7 parameter scores, `overall_score`, `percentage`, `category`, `confidence`, `created_at`; `UNIQUE(idea_id, version)`. | **PARTIAL** | `backend/app/models/validation.py` | Table contains `overall_score`, `confidence_score`, and `version`, but lacks direct columns for `previous_report_id`, individual 7 parameter scores, and `percentage`. |
| **Venture Idea Fields**<br>`location`, `business_model`, `revenue_model`, `competitors`, `usp`, `technology`, `current_stage` (`idea`\|`prototype`\|`MVP`\|`pilot`). | **PARTIAL** | `backend/app/models/idea.py` | Model contains `business_model`, `revenue_model`, `technology`; missing `location`, `competitors`, `usp`, and `current_stage`. |
| **API Endpoints (Ownership Enforced, 404 for Others)**<br>• `GET /ideas/{id}/reports`<br>• `GET /ideas/{id}/reports/{report_id}`<br>• `GET /ideas/{id}/compare?from=1&to=2`<br>• `POST /ideas/{id}/validate`<br>• `POST /ideas/{id}/chat`<br>• `GET/PUT /users/profile`<br>• `PUT /users/password`<br>Mounted under `/api/v1` and `/api` | **PARTIAL** | `backend/app/api/ideas.py`, `backend/app/api/reports.py`, `backend/app/api/users.py`, `backend/app/api/comparisons.py` | Routes exist under disparate URLs (e.g. `/reports/{id}`, `/ideas/{id}/comparison?v1=1&v2=2`, `/profile/settings`). Exact path aliases matching the report specification must be unified with strict multi-tenant 404 enforcement. |
| **Version Comparison Math**<br>Return per-parameter delta ($S_{v2} - S_{v1}$), overall delta, confidence delta, reasons for change, and whether v1 recommendations were marked `COMPLETED`. | **PARTIAL** | `backend/app/api/comparisons.py` | Overall delta calculation exists; parameter-by-parameter delta and recommendation completion verification need implementation. |
| **Report UI Components**<br>Executive gauge + confidence, 7-param breakdown, strengths/weaknesses, risk matrix (severity + mitigation), evidence & verification, top-3 recommendations with OPEN/COMPLETED toggle, version dropdown, delta badge. | **PARTIAL** | `frontend/src/pages/ReportResultPage.tsx` | Recommendations do not have interactive OPEN/COMPLETED toggle connected to backend; version delta badge and evidence verification section need additions. |

---

### Phase 5: Chat, Fault Tolerance, and Profile

| Spec Item | Status | Existing File Paths | Gap & Required Modifications |
| :--- | :---: | :--- | :--- |
| **Dialogue Manager (4-Step FSM)**<br>1. Context assembly<br>2. Entity extraction<br>3. State sync (never overwrite collected fields with empty values)<br>4. Completeness audit asking targeted questions.<br>Readiness = name + problem + solution + target customer. | **PARTIAL** | `backend/app/services/chat_service.py` | `ChatService` performs regex extraction and turn tracking, but lacks an explicit four-step finite-state dialogue manager with non-destructive state synchronization. |
| **Extraction Triggers**<br>Exact spec triggers: "target is/targeting/audience/for students", "subscription/freemium/commission/fee", "charge $X/month", "problem is/struggle with", "we are building", industry keywords (edtech, fintech, health, food delivery). | **PARTIAL** | `backend/app/services/chat_service.py` | Basic patterns exist but omit several required regex trigger variations. |
| **Fault Tolerance & Fallback**<br>12s timeout on LLM call; on failure retry once, then deterministic fallback flagged as "offline estimate, not market validation" with confidence penalty; seeded by MD5 hash of idea text for reproducibility. | **PARTIAL** | `backend/app/services/llm_providers/gemini_provider.py`, `backend/app/services/llm_providers/mock_provider.py` | Mock fallback exists, but timeout is not strictly 12s with single retry, and MD5 seed determinism is not implemented. |
| **Information Gap Detector (L11)**<br>Outputs targeted research questions per missing venture field. | **DONE** | `backend/app/services/information_gap_service.py` | Fully functional; generates context-aware research questions for missing fields. |
| **Profile Page & Incubator Guidelines**<br>Personal + academic details, change password, notification preferences, activity log (from `audit_logs`). Add "Incubator Guidelines" page. | **PARTIAL** | `frontend/src/pages/ProfilePage.tsx`, `frontend/src/pages/SettingsPage.tsx` | Profile and settings exist in separate pages; academic details and activity logs from `audit_logs` are missing. Incubator Guidelines page is not present. |
| **Authentication & Google Token Verification**<br>Bcrypt hashing, HS256 JWT with 7-day expiry, default role `USER`. Google ID token signature verification enforced when `ENVIRONMENT != "development"`. | **PARTIAL** | `backend/app/core/config.py`, `backend/app/core/security.py`, `backend/app/api/auth.py` | Expiry is currently 60 minutes instead of 7 days; Google token signature enforcement under production/staging requires verification and dedicated test. |

---

### Phase 6: Automated Test Suites

| Spec Item | Status | Existing File Paths | Gap & Required Modifications |
| :--- | :---: | :--- | :--- |
| **Pytest Suites**<br>• Scoring: weights sum to 1.0, boundary tests (all 1.0 $\to 10\%$, all 10.0 $\to 100\%$, NaN $\to 5.0$), sample calc (8.5, 8.4, 8.1, 9.7, 9.4, 7.9, 9.3 $\to 8.65 \to 86.5\%$)<br>• Layer 8 caps and claim classification<br>• Confidence bounds (10%–95%)<br>• 384-dim normalized embeddings + FAISS nearest idea + self-exclusion<br>• Tenant authorization (User B requesting User A idea $\to 403/404$)<br>• Versioning: v1 $\to$ v2 new row, delta math, UNIQUE constraint<br>• Fault tolerance: simulated LLM timeout $\to$ fallback flagged<br>• Auth: register, login (TC-02 Student login), bad password, JWT expiry | **PARTIAL** | `backend/app/tests/` | 87 existing tests pass; however, tests for `report_v1` sample calculation, FAISS indexer, claim taxonomy, and TC-02 Student login must be added. |
| **Test Documentation**<br>Create `docs/TEST_REPORT.md` (recorded execution results) and `docs/TEST_CASES.md` (TC-01..TC-10 table including TC-02 Student login linked to test functions). | **MISSING** | `docs/TEST_REPORT.md`, `docs/TEST_CASES.md` | Neither document exists in the repository. |

---

### Phase 7: Empirical Benchmarking

| Spec Item | Status | Existing File Paths | Gap & Required Modifications |
| :--- | :---: | :--- | :--- |
| **Benchmark Script (`scripts/run_benchmarks.py`)**<br>Evaluates 4 ventures across 3 runs each:<br>1. EduPath AI (EdTech)<br>2. MediDorm Health (HealthTech)<br>3. FinDorm Split (FinTech)<br>4. Campus Quick Delivery (v1 vague vs. v2 concrete monetization)<br>Records score %, category, confidence, per-param scores, wall-clock ms, LLM mode. Computes mean/min/max latency and score variance. | **MISSING** | `scripts/run_benchmarks.py` | Benchmark runner script does not exist. |
| **Benchmark Deliverables**<br>`docs/BENCHMARKS.md` and CSV output with real execution metrics (no fabricated numbers). | **MISSING** | `docs/BENCHMARKS.md`, `docs/benchmarks.csv` | Benchmark reports do not exist. |

---

### Phase 8: Project Documentation & Report Corrections

| Spec Item | Status | Existing File Paths | Gap & Required Modifications |
| :--- | :---: | :--- | :--- |
| **README.md Updates**<br>Dev instructions (SQLite), Celery/Redis mode, environment variable table (no secrets), Known limitations section (SQLite concurrency, static competitor dataset, fixed weights, founder-input dependence). | **PARTIAL** | `README.md` | Existing README contains setup instructions but lacks the structured environment variables table and detailed Known Limitations section. |
| **Report Corrections (`docs/REPORT_CORRECTIONS.md`)**<br>Discrepancy log detailing every difference between academic report draft and final working system (frameworks, versions, routes, metrics). | **MISSING** | `docs/REPORT_CORRECTIONS.md` | Discrepancy report does not exist. |

---

## Action Plan by Implementation Phase

1. **Phase 1**: Implement `report_v1` scoring engine alongside `legacy_v9` in `backend/app/services/scoring_service.py`; update `calculate_validation_score`, `clamp_score`, classification rubric, and frontend visual tokens.
2. **Phase 2**: Add claim classification (FACT, INFERENCE, ASSUMPTION, UNKNOWN) in Layer 8 and persist evidence attribution; integrate Evidence & Verification section in frontend.
3. **Phase 3**: Implement real FAISS vector search (`IndexFlatIP`) with unit L2 normalization, disk persistence, DB rebuild, NumPy fallback, `idea_embeddings` table, and sample venture seeding.
4. **Phase 4**: Add schema tables (`report_analyses`, `idea_embeddings`, updated `audit_logs`, updated `ideas`), Alembic migrations, unified API routes with 404 ownership enforcement, recommendation completion toggle, and delta comparisons.
5. **Phase 5**: Implement 4-step FSM dialogue manager in chat, 12s timeout with single retry and MD5-seeded fallback, profile update endpoints, and Incubator Guidelines page.
6. **Phase 6**: Write comprehensive test suites covering all criteria; record test executions in `docs/TEST_REPORT.md` and `docs/TEST_CASES.md`.
7. **Phase 7**: Execute `scripts/run_benchmarks.py` across the 4 benchmark ventures; compile results into `docs/BENCHMARKS.md` and CSV.
8. **Phase 8**: Update `README.md` and produce `docs/REPORT_CORRECTIONS.md`.
