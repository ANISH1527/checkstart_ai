# Report Corrections Log: CheckStart AI

**Date:** October 30, 2026  
**Document:** Audit and Discrepancy Log for Academic Project Report: *"AI Validation Platform for Student Startup Ideation"*  
**Purpose:** Enumerates every technical discrepancy between the draft report text (in `project_report_docs/`) and the verified codebase implementation, allowing the report author to update the academic report to 100% truthfulness and precision.

---

## 1. Discrepancy Summary Table

| Category | Report Draft Text | Verified Codebase Implementation | Report Section to Update |
| :--- | :--- | :--- | :--- |
| **Primary Scoring Engine** | 9-dimension weighted engine (Scalability 3%, Risk 2%) rolled up into 7 visual parameters. | 7 canonical parameters (`report_v1`) directly on a 1.0–10.0 scale ($S=\sum w_i s_i, V=S\times 10$). Weights sum to exactly 1.0. 9-dimension engine preserved strictly as `legacy_v9`. | Chapter 3 (Sec 3.1 Obj 6, Sec 3.2 Step 15, Sec 3.6), Chapter 4 (Sec 4.4) |
| **Viability Classification Rubric** | 5-tier rubric: `EXCEPTIONAL` ($\ge 90$), `STRONG` ($\ge 75$), `MODERATE` ($\ge 60$), `WEAK` ($\ge 40$), `VERY_WEAK` ($< 40$). | 4 canonical bands with actionable directives: **Highly Promising** (80.0–100.0%), **Promising** (60.0–79.9%), **Needs Improvement** (40.0–59.9%), **High Risk** (0.0–39.9%). Minimum attainable score is 10.0%. | Chapter 3 (Sec 3.6.3), Chapter 4 (Sec 4.4) |
| **Vector Similarity Index** | Scikit-learn cosine distance matrix in memory. | Facebook AI Similarity Search (**FAISS `IndexFlatIP`** wrapped in `IndexIDMap2` over 384-dim L2-normalized vectors), persisted to `backend/vector_index.faiss` and rebuilt from SQLite DB on startup, with NumPy dot-product fallback. | Chapter 3 (Sec 3.1 Obj 3, Sec 3.3 Table 3.1, Sec 3.7), Chapter 4 (Sec 4.2) |
| **Layer 8 Verification & Claims** | Basic score caps (e.g., revenue model missing cap). | Dual-purpose Layer 8: 1) Penalty caps (`revenue_potential <= 4.5`, `target_customer <= 4.0`, fraud/absurdity $\le 2.0$); 2) **Claim Verification Taxonomy**: classifies claims as `FACT`, `INFERENCE`, `ASSUMPTION`, or `UNKNOWN`, backed by Layer 6 evidence citations with origin and retrieval date. | Chapter 3 (Sec 3.1 Obj 5, Sec 3.8), Chapter 4 (Sec 4.3) |
| **Database Schema & Additions** | Basic tables: `users`, `ideas`, `validation_results`. | Dedicated tables added via Alembic migrations: `idea_embeddings` (vector binary, hash cache), `report_analyses` (strengths, weaknesses, risks, recommendations, evidence JSON), `audit_logs` (event, duration_ms, user_id, idea_id); extended `ideas` and recommendation `status` (`OPEN` vs `COMPLETED`). | Chapter 3 (Sec 3.9), Chapter 4 (Sec 4.1) |
| **Canonical REST Endpoints** | Informal endpoints (`/api/conversations/*`, `/api/ideas/compare`). | Formal RESTful routes under `/api/v1` (with `/api` compatibility aliases): `/ideas/{id}/reports`, `/ideas/{id}/reports/{report_id}`, `/ideas/{id}/compare?from=1&to=2`, `/ideas/{id}/validate`, `/ideas/{id}/chat`, `/users/profile`, `/users/password`, enforcing multi-tenant isolation. | Chapter 3 (Sec 3.10 Table 3.4), Chapter 4 (Sec 4.5) |
| **Chat Dialogue Manager** | Informal single-prompt or unstructured conversational wrapper. | Formal **4-step Finite-State Dialogue Manager** (Context Assembly $\rightarrow$ Entity Extraction $\rightarrow$ State Sync $\rightarrow$ Completeness Audit), exact regex triggers, and readiness formula ($R = \text{name} + \text{problem} + \text{solution} + \text{customer}$). | Chapter 3 (Sec 3.1 Obj 1, Sec 3.5), Chapter 4 (Sec 4.1) |
| **LLM Fault Tolerance** | Basic mock fallback on exception. | 12-second hard timeout on LLM request, single automatic retry, followed by deterministic offline fallback seeded by MD5 hash of idea text, clearly flagged in response payload and UI with confidence penalty deduction. | Chapter 3 (Sec 3.8.3), Chapter 4 (Sec 4.3) |
| **Authentication & Tokens** | JWT token lifespan 1440 minutes (24 hours); unverified Google SSO. | **7-day JWT expiry (10080 minutes)**; cryptographically verified Google ID tokens (signature, issuer, audience check) enforced when `ENVIRONMENT != development`. | Chapter 3 (Sec 3.3 Table 3.1, Sec 3.4.2), Chapter 4 (Sec 4.5) |
| **Automated Test Counts** | Stated 85 test cases across 15 test files (backend only). | **186 Total Passing Tests**: **111 Backend Pytest Cases** (across 19 modules) + **75 Frontend Vitest Cases** (`scoreUtils.test.ts`). Complete TC-01 through TC-10 test matrix including TC-02 (Student Login). | Chapter 5 (Sec 5.1, Sec 5.2, Table 5.1, Table 5.2) |

---

## 2. Detailed Chapter-by-Chapter Correction Guide

### Chapter 3: Objectives and Methodology

1. **Section 3.1: Objectives of the Proposed Work**
   - **Objective 3 (Vector Similarity):** Replace *"Scikit-learn cosine distance"* with *"FAISS IndexFlatIP over 384-dimensional L2-normalized all-MiniLM-L6-v2 embeddings, serialized to disk (`vector_index.faiss`) and rebuilt on startup from SQLite DB, with NumPy fallback"*.
   - **Objective 5 (Layer 8 Verification):** Clarify that Layer 8 enforces both score penalty caps AND claim taxonomy verification (`FACT`, `INFERENCE`, `ASSUMPTION`, `UNKNOWN`).
   - **Objective 6 (Mathematical Scoring):** Replace 9-dimension primary engine with *"authoritative 7-parameter scoring engine (`report_v1`) with weights summing to exactly 1.0 (Market Demand 0.25, Problem Severity 0.20, Competition 0.15, Target Customer 0.10, Innovation 0.10, Feasibility 0.10, Revenue Potential 0.10), mapped to 4 classification bands (Highly Promising, Promising, Needs Improvement, High Risk)"*.
   - **Objective 10 (Testing):** Update target from *"at least 80 test cases"* to *"186 automated test cases (111 backend pytest, 75 frontend vitest)"*.

2. **Section 3.3: Selection of Components, Tools, and Techniques (Table 3.1)**
   - **Mathematical ML:** Change Scikit-learn entry to **FAISS (faiss-cpu 1.8.0 / IndexFlatIP)** for fast inner-product cosine search.
   - **JWT Tokens:** Update token expiration from 24 hours to **7 days (10080 minutes)**.
   - **Testing:** Update test runner row to reflect both **Pytest 9.1.1** (backend) and **Vitest 2.1.8** (frontend).

3. **Section 3.6: Authoritative Mathematical Viability Scoring Engine**
   - Provide the exact formula:
     $$\mathcal{S} = \sum_{i=1}^{7} w_i \cdot \text{clamp}(s_i), \quad \mathcal{V} = \mathcal{S} \times 10 \quad (\%) $$
   - Where weights are:
     - $w_{\text{market\_demand}} = 0.25$
     - $w_{\text{problem\_severity}} = 0.20$
     - $w_{\text{competition}} = 0.15$
     - $w_{\text{target\_customer}} = 0.10$
     - $w_{\text{innovation}} = 0.10$
     - $w_{\text{feasibility}} = 0.10$
     - $w_{\text{revenue\_potential}} = 0.10$
   - Note the boundary conditions:
     - All minimum inputs ($s_i = 1.0$) yield minimum attainable score $\mathcal{V} = 10.0\%$.
     - All maximum inputs ($s_i = 10.0$) yield $\mathcal{V} = 100.0\%$.
     - $\text{clamp}(x)$ handles `None`/`NaN` by defaulting to $5.0$, and bounds values to $[1.0, 10.0]$.

4. **Section 3.8: Deterministic Verification Guardrails (Layer 8)**
   - Document the four claim verification categories:
     - **`FACT`**: Claim directly corroborated by retrieved benchmark evidence or competitor match in Layer 6.
     - **`INFERENCE`**: Logical deduction derived from validated context.
     - **`ASSUMPTION`**: Uncorroborated market hypothesis proposed by founder.
     - **`UNKNOWN`**: Missing or ambiguous parameter context.
   - Document the penalty caps:
     - Unmonetized/missing revenue model $\rightarrow \text{revenue\_potential} \le 4.5$.
     - Broad/vague target customer ("everyone") $\rightarrow \text{target\_customer} \le 4.0$.
     - Impossible/fraudulent ideas $\rightarrow \text{all parameters} \le 2.0$.

5. **Section 3.10: REST API Design (Table 3.4)**
   - Update API table to match canonical routes:
     - `GET /api/v1/ideas/{id}/reports`
     - `GET /api/v1/ideas/{id}/reports/{report_id}`
     - `GET /api/v1/ideas/{id}/compare?from=1&to=2`
     - `POST /api/v1/ideas/{id}/validate`
     - `POST /api/v1/ideas/{id}/chat`
     - `GET/PUT /api/v1/users/profile`
     - `PUT /api/v1/users/password`

---

### Chapter 4: Module-Wise Implementation

1. **Module 1 (Conversational Inception):**
   - Document the 4-step dialogue manager:
     1. Context Assembly: Loads past message history and existing idea attributes.
     2. Entity Extraction: Applies exact regex triggers for student pitch phrases.
     3. State Synchronization: Safely merges non-empty attributes without overwriting previously captured fields.
     4. Completeness Audit: Computes readiness based on presence of name, problem, solution, and target customer.

2. **Module 2 (Vector Embedding & Competitor Matching):**
   - Detail the `FaissVectorService` implementation:
     - Vectors normalized to unit length ($L_2 = 1.0$), transforming inner product into exact cosine similarity.
     - Startup rebuild: reads from `idea_embeddings` table and populates FAISS index.
     - Self-exclusion: prevents the evaluated idea from matching against itself in search results.

3. **Module 4 (Scoring Engine & Report Generation):**
   - Detail the version delta calculation: $\Delta \mathcal{S} = \mathcal{S}_{v2} - \mathcal{S}_{v1}$, confidence delta, and status tracking for top-3 recommendations (`OPEN` $\rightarrow$ `COMPLETED`).

---

### Chapter 5: Empirical Testing, Verification & Results

1. **Section 5.1 & 5.2: Test Suite Execution**
   - Update total test count from 85 to **186 passing tests** (111 pytest + 75 vitest).
   - Insert Table of Academic Test Cases (TC-01 through TC-10) directly from `docs/TEST_CASES.md`. Note that **TC-02 (Student Login)** is explicitly covered by `backend/app/tests/test_auth.py::test_tc02_student_login`.

2. **Section 5.3: Empirical Benchmarking Results**
   - Replace any simulated numbers with the actual empirical values from `docs/BENCHMARKS.md` and `docs/benchmarks.csv`:
     - **EduPath AI (EdTech):** Score **`77.0%`** (Promising), Latency mean **`6223.78 ms`** (incorporates cold-start weights loading).
     - **MediDorm Health (HealthTech):** Score **`77.0%`** (Promising), Latency mean **`59.43 ms`**.
     - **FinDorm Split (FinTech):** Score **`77.0%`** (Promising), Latency mean **`60.61 ms`**.
     - **Campus Quick Delivery (v1 Unrefined):** Score **`70.0%`** (Promising), Target customer capped at **`2.5`**, Confidence **`32.2%`**.
     - **Campus Quick Delivery (v2 Refined):** Score **`77.0%`** (Promising), Target customer restored to **`8.8`**, Confidence **`40.0%`**, Score Delta **`+7.0%`**.
     - **Score Variance:** **`0.0`** across all repeated runs (deterministic mathematical scoring).
