# CheckStart AI: Academic Report Evidence Register & Traceability Matrix

This evidence register links every quantitative metric, mathematical formula, architectural parameter, test result, and technical claim reported in the academic project report directly to the corresponding source code lines, database schemas, test logs, or build manifests.

---

## 1. Mathematical Scoring & Calibration Evidence

| Technical Claim / Parameter | Exact Value in Report | Source Code File & Exact Line | Verification Logic & Context |
| :--- | :--- | :--- | :--- |
| **Backend Weight: Market Demand** | `0.25` (25%) | `backend/app/services/scoring_service.py:32` | Normalized dictionary key `market_demand: 0.25` |
| **Backend Weight: Problem-Solution Fit** | `0.20` (20%) | `backend/app/services/scoring_service.py:33` | Normalized dictionary key `problem_solution_fit: 0.20` |
| **Backend Weight: Target Customer** | `0.10` (10%) | `backend/app/services/scoring_service.py:34` | Normalized dictionary key `target_customer_clarity: 0.10` |
| **Backend Weight: Competition** | `0.10` (10%) | `backend/app/services/scoring_service.py:35` | Normalized dictionary key `competition: 0.10` |
| **Backend Weight: Uniqueness** | `0.10` (10%) | `backend/app/services/scoring_service.py:36` | Normalized dictionary key `uniqueness_innovation: 0.10` |
| **Backend Weight: Feasibility** | `0.10` (10%) | `backend/app/services/scoring_service.py:37` | Normalized dictionary key `technical_feasibility: 0.10` |
| **Backend Weight: Business Potential** | `0.10` (10%) | `backend/app/services/scoring_service.py:38` | Normalized dictionary key `business_potential: 0.10` |
| **Backend Weight: Scalability** | `0.03` (3%) | `backend/app/services/scoring_service.py:39` | Normalized dictionary key `scalability: 0.03` |
| **Backend Weight: Risk Level (Inverted)**| `0.02` (2%) | `backend/app/services/scoring_service.py:40` | Calculated as `(100 - risk_score) * 0.02` |
| **Total Weight Summation** | Exactly `1.000` (100%) | `backend/app/tests/test_scoring.py:15-22` | Automated test verifies `sum(weights.values()) == 1.0` |
| **Frontend Visual Rollup Scaling** | 1.0 to 10.0 scale | `backend/app/services/scoring_service.py:98-135` | Maps 9 dimensions to 7 visual parameters divided by 10 |
| **Viability Band: EXCEPTIONAL** | 90.0 – 100.0 | `backend/app/services/scoring_service.py:65` | Returns `EXCEPTIONAL` ("Highly Promising") |
| **Viability Band: STRONG** | 75.0 – 89.9 | `backend/app/services/scoring_service.py:68` | Returns `STRONG` ("Promising") |
| **Viability Band: MODERATE** | 60.0 – 74.9 | `backend/app/services/scoring_service.py:71` | Returns `MODERATE` ("Moderate Viability") |
| **Viability Band: WEAK** | 40.0 – 59.9 | `backend/app/services/scoring_service.py:74` | Returns `WEAK` ("Needs Improvement") |
| **Viability Band: VERY_WEAK** | 0.0 – 39.9 | `backend/app/services/scoring_service.py:77` | Returns `VERY_WEAK` ("High Risk") |
| **Confidence Base Formula** | `0.35C_comp + 0.35C_agree + 0.15C_evid + 0.15C_rules` | `backend/app/services/confidence_service.py:45-52` | Linear combination of 4 weighted factors |
| **Confidence Deduction: Layer 8 Override**| `-5.0` per override | `backend/app/services/confidence_service.py:82` | Deducts 5.0 points per score override |
| **Confidence Deduction: Zero Evidence** | `-15.0` | `backend/app/services/confidence_service.py:95` | Deducts 15.0 points if evidence count == 0 |
| **Confidence Deduction: Mock Provider** | `-20.0` (Cap: 40%) | `backend/app/services/confidence_service.py:112` | Deducts 20.0 points and enforces ceiling of 40.0% |

---

## 2. Rule Verification & Guardrails Evidence

| Guardrail Rule | Exact Threshold / Cap | Source Code File & Exact Line | Verification Logic |
| :--- | :--- | :--- | :--- |
| **Rule 1: Missing Revenue Model** | Cap `business_potential` at 45.0 | `backend/app/services/verification_service.py:65-80` | Overrides score if monetization unspecified |
| **Rule 1b: Explicit "No Revenue" Stance**| Cap `business_potential` at 10.0 | `backend/app/services/verification_service.py:82-95` | Overrides score if founder rejects revenue |
| **Rule 2: Vague Target Customer** | Cap `target_customer` at 25.0 | `backend/app/services/verification_service.py:110-130`| Overrides score if customer is "everyone" |
| **Rule 3: Deceptive / Fraud Product** | Cap core scores at $\le 15.0$ | `backend/app/services/verification_service.py:145-170`| Overrides score on "magic", "invisible water" |
| **Rule 4: Anti-Marketing Stance** | Cap Market & Business at 20.0 | `backend/app/services/verification_service.py:185-205`| Overrides score if founder refuses marketing |
| **Prompt Injection Quarantine** | Lexical Regex Quarantine | `backend/app/services/rule_service.py:114-123` | Regex: `ignore previous instructions`, `DAN mode` |

---

## 3. Semantic Similarity & Caching Evidence

| Parameter | Exact Value in Report | Source Code File & Exact Line | Verification Logic |
| :--- | :--- | :--- | :--- |
| **Embedding Architecture** | `all-MiniLM-L6-v2` | `backend/app/services/embedding_service.py:25` | 384-dimensional dense sentence embeddings |
| **Cosine High Overlap Threshold** | $\ge 0.85$ | `backend/app/services/similarity_service.py:45` | Flags potential competitor overlap |
| **Cosine Moderate Overlap Threshold** | $0.72 - 0.849$ | `backend/app/services/similarity_service.py:52` | Flags moderate semantic overlap |
| **Unique Concept Threshold** | $< 0.72$ | `backend/app/services/similarity_service.py:58` | Classifies idea as unique |
| **Embedding Cache Strategy** | SHA-256 + Redis / In-Memory | `backend/app/services/embedding_cache_service.py:25-50` | In-memory Python fallback on Redis failure |

---

## 4. Empirical Test Suite & Verification Evidence

| Empirical Metric | Verified Value | Execution Source | Timestamp / Benchmark Run |
| :--- | :--- | :--- | :--- |
| **Total Test Cases Collected** | **85 Items** | `backend/pytest.ini` (`python -m pytest`) | Test session execution |
| **Total Test Cases Passed** | **85 Passed (100%)** | Pytest Execution Session | 100% Pass Rate across 15 test files |
| **Total Test Execution Duration** | **218.72 seconds** | Pytest Session Summary | 3 minutes 38.72 seconds |
| **Benchmark Discrimination Delta** | **+42.8 points** | `backend/app/tests/test_benchmark.py` | Detailed (81.2) vs Vague (38.4) |
| **Frontend Production Bundling** | **2,772 modules transformed** | `npx vite build` in `frontend/` | Vite 5.4.21 production build |
| **Frontend Build Execution Time** | **29.27 seconds** | Vite Build Output | Output bundled into `dist/` |

---

## 5. Known Limitations & Architectural Disclosures

| Subsystem / Feature | Exact Implementation Status | Source Code File & Line | Disclosed Finding in Report |
| :--- | :--- | :--- | :--- |
| **Live Knowledge Retrieval (RAG)**| **Disabled Stub Class** | `backend/app/services/rag_service.py:1-13` | Class instantiated with `enabled = False`, returns `[]` |
| **Google OAuth Signature Check** | **Unverified Claims** | `backend/app/api/auth.py:176` | Uses `jwt.get_unverified_claims`; requires JWKS hardening |
| **UI Screenshot Assets** | **No static images in repo** | Workspace file inspection | Documented capture guide provided for 5 live application screens |
| **Publication Proof** | **Not published** | Academic project status | Correctly marked as placeholder in Appendix IV & V |
| **Plagiarism Clearance** | **Institutional placeholder** | Academic submission requirements | Correctly designated as placeholder in Appendix VII |
