# Module-by-Module Technical Implementation Analysis: CheckStart AI

This document provides an exhaustive, evidence-based breakdown of all eleven (11) functional modules in **CheckStart AI**. Every module is analyzed with direct references to source code files, exact line numbers, data contracts, algorithms, error handling, and test verification evidence.

---

## Module Index

1. [Module 1: Authentication, Authorization & User Profile Management](#module-1-authentication-authorization--user-profile-management)
2. [Module 2: Conversational Idea Inception & Socratic Mentorship](#module-2-conversational-idea-inception--socratic-mentorship)
3. [Module 3: 15-Layer Validation Pipeline Orchestrator](#module-3-15-layer-validation-pipeline-orchestrator)
4. [Module 4: Dense Vector Embedding & Semantic Similarity Matcher](#module-4-dense-vector-embedding--semantic-similarity-matcher)
5. [Module 5: Deterministic Rule Verification & Score Override Engine](#module-5-deterministic-rule-verification--score-override-engine)
6. [Module 6: Authoritative 9-Dimension Scoring & 7-Parameter Visual Rollup](#module-6-authoritative-9-dimension-scoring--7-parameter-visual-rollup)
7. [Module 7: Multi-Factor Calibrated Confidence Engine](#module-7-multi-factor-calibrated-confidence-engine)
8. [Module 8: Strategic Diagnosis, Root Cause & Recommendation Engine](#module-8-strategic-diagnosis-root-cause--recommendation-engine)
9. [Module 9: Multi-Idea Comparative Synthesis Matrix](#module-9-multi-idea-comparative-synthesis-matrix)
10. [Module 10: Idea History, Versioning & Delta Tracking](#module-10-idea-history-versioning--delta-tracking)
11. [Module 11: Founder & Administrative Telemetry Dashboard](#module-11-founder--administrative-telemetry-dashboard)

---

## Module 1: Authentication, Authorization & User Profile Management

- **Module Name**: Authentication, RBAC & Profile Management Engine
- **Purpose**: Authenticates student founders and administrators, issues HMAC-SHA256 JWT tokens, manages salted bcrypt passwords, integrates Google Identity Services (GIS) One Tap sign-in, and maintains collegiate founder metadata (college, course, graduation year).
- **Inputs and Outputs**:
  - *Inputs*: Registration payload (`name`, `email`, `password`, collegiate details) or Login credentials (`email`/`username`, `password`) or Google credential token.
  - *Outputs*: JSON response `{ success: true, data: { token: "<JWT>", user: { id, email, name, role } } }`.
- **Internal Processing**:
  - Salting and hashing passwords via `Passlib` (`bcrypt`).
  - Encoding JWT access tokens with 1440-minute (dev) or 60-minute (prod) expiration and subject claim `sub=user_id`.
  - Enforcing Role-Based Access Control (RBAC) via FastAPI dependencies (`get_current_user`, `require_admin`).
  - Google GIS token decoding and user auto-provisioning with profile and default theme settings.
- **Algorithms / Business Rules**:
  - Rate limited to 5 requests per minute on login/registration via SlowAPI.
  - Minimum 6 characters required for passwords; email uniqueness enforced at DB constraint level.
  - Role check: Administrative routes enforce `current_user.role == "ADMIN"`.
- **Relevant Source Files and Functions**:
  - Backend: `backend/app/api/auth.py` (`register_user:57`, `login_for_access_token:101`, `google_auth:165`, `admin_login:253`, `forgot_password:292`, `reset_password:325`).
  - Backend Security: `backend/app/core/security.py` (`create_access_token`, `verify_password`, `get_password_hash`).
  - Backend Dependencies: `backend/app/api/dependencies.py` (`get_current_user:12`, `require_admin:36`).
  - Frontend Context & Pages: `frontend/src/contexts/AuthContext.tsx`, `frontend/src/pages/LoginPage.tsx`, `frontend/src/pages/RegisterPage.tsx`.
- **Dependencies & Integrations**: `python-jose`, `passlib[bcrypt]`, `slowapi`, Google Identity Services (`gsi/client`).
- **Database Interactions**: Queries and writes to `users`, `user_profiles`, and `user_preferences`.
- **Error Handling**: Throws HTTP 401 (`unauthorized`) on invalid credentials, HTTP 409 (`conflict`) on duplicate email, and HTTP 429 (`rate_limit_exceeded`) on rapid requests.
- **Relationship with Other Modules**: Provides the authenticated user identity (`user_id`) to all subsequent idea, validation, and dashboard operations.
- **Evidence of Implementation**: Fully active in source code. 8 dedicated automated tests in `backend/app/tests/test_auth.py` and 2 RBAC tests in `test_architectural_tasks.py` passing with 100% rate.

---

## Module 2: Conversational Idea Inception & Socratic Mentorship

- **Module Name**: Conversational Socratic Validation Co-Pilot
- **Purpose**: Provides an interactive multi-turn chat interface where student founders describe their venture concept naturally. Extracts structured venture attributes incrementally, tracks idea completeness, quarantines adversarial inputs, and provides Socratic coaching.
- **Inputs and Outputs**:
  - *Inputs*: Natural language chat messages (`session_id`, `message`, `client_message_id`).
  - *Outputs*: Socratic assistant message, updated completeness score (0–100%), list of extracted entities, and turn-1 instant validation trigger status.
- **Internal Processing**:
  - Client message idempotency verification using `client_message_id`.
  - Regex pattern scanning for prompt injection keywords (`ignore previous instructions`, `DAN`, `reveal prompt`).
  - Socratic heuristics: If missing problem, target customer, or revenue model, formulates targeted clarifying questions rather than generating generic fluff.
  - Automatic structured profile extraction updating session context in real-time.
- **Algorithms / Business Rules**:
  - Completeness calculation: Weighs Problem (25%), Solution (20%), Target Customer (20%), Industry (15%), Business/Revenue Model (20%).
  - Maximum 1–2 focused questions per turn to prevent founder fatigue.
  - Prompt injection quarantine: Logs security event, stops pipeline, and outputs pedagogical warning.
- **Relevant Source Files and Functions**:
  - Backend: `backend/app/services/chat_service.py` (`create_session:207`, `process_message:328`, `_extract_entities:438`, `_calculate_completeness:473`, `_generate_socratic_reply:500`).
  - Backend Router: `backend/app/api/sessions.py` (`create_conversation:35`, `send_message:75`, `validate_from_session:124`).
  - Frontend Page: `frontend/src/pages/NewValidationPage.tsx` (Handles chat stream, entity badges, and one-click validate button).
  - Frontend UI: `frontend/src/components/SafeMarkdown.tsx` (Sanitized Markdown rendering).
- **Dependencies & Integrations**: SQLAlchemy ORM, regex engine, Pydantic schemas.
- **Database Interactions**: Reads and updates `validation_sessions`; appends rows to `conversation_messages`.
- **Error Handling**: Missing sessions return HTTP 404; duplicate `client_message_id` returns existing message without re-execution (idempotent 200).
- **Relationship with Other Modules**: Prepares structured venture context (`idea_dict`) that serves as the direct input to Module 3 (Validation Pipeline).
- **Evidence of Implementation**: 8 automated tests in `backend/app/tests/test_chat_service.py` passing with 100% rate.

---

## Module 3: 15-Layer Validation Pipeline Orchestrator

- **Module Name**: 15-Layer Validation Pipeline Engine
- **Purpose**: The central processing pipeline of CheckStart AI. Coordinates fifteen distinct evaluation layers in strict sequence, capturing granular millisecond execution telemetry for each layer and persisting comprehensive validation results.
- **Inputs and Outputs**:
  - *Inputs*: Structured idea dictionary containing `title`, `description`, `problem`, `solution`, `target_customer`, `industry`, `business_model`, `revenue_model`, `pricing`.
  - *Outputs*: Complete `ValidationResult` object including 9-dimensional parameter scores, 7-parameter visual rollup, confidence score, evidence citations, competitor list, root-cause analyses, prioritized recommendations, and pipeline timing telemetry.
- **Internal Processing & The 15 Layers**:
  - *Layer 1 (IdeaProfileExtractor)*: Structural completeness analysis and vagueness check.
  - *Layer 2 (NLPService)*: Stopword filtering, top 10 keyword extraction, and structural cue parsing.
  - *Layer 3 (EmbeddingService)*: Generates 384-dimensional dense semantic embedding.
  - *Layer 4 (SimilarityService)*: Cosine distance calculation against peer venture embeddings.
  - *Layer 5 (RuleService)*: Hard constraints evaluation (word count, prompt injection, minimum length).
  - *Layer 6 (EvidenceService)*: Benchmark evidence retrieval and citation classification.
  - *Layer 7 (LLMProvider)*: Multi-parameter prompt execution (`v1.3`) via Gemini Pro or MockProvider.
  - *Layer 8 (VerificationService)*: Deterministic guardrail score overrides.
  - *Layer 9 (ScoringService)*: Authoritative 9-dimension weighted arithmetic summation.
  - *Layer 10 (ConfidenceService)*: Multi-factor confidence calibration calculation.
  - *Layer 11 (InformationGapService)*: Missing business element identification.
  - *Layer 12 (RootCauseService)*: Weakness root-cause diagnosis.
  - *Layer 13 (ImprovementStrategyService)*: Actionable mitigation hypothesis generation.
  - *Layer 14 (ActionPrioritizationService)*: Ranking top-3 critical next-step actions.
  - *Layer 15 (ImprovementImpactService)*: Expected score delta gain prediction.
- **Algorithms / Business Rules**:
  - Millisecond timing recorded for every layer: `timing_dict[f"layer_{i}_{name}"] = duration_ms`.
  - Dual execution modes: Asynchronous Celery task via Redis or direct synchronous execution for interactive UI requests.
- **Relevant Source Files and Functions**:
  - Backend: `backend/app/services/validation_service.py` (`run_validation_pipeline:42-390`).
  - Celery Tasks: `backend/app/services/tasks.py` (`run_validation_pipeline_task:17-48`).
  - Backend API: `backend/app/api/validation.py` (`validate_idea_endpoint:32`, `analyze_idea_sync:110`).
- **Dependencies & Integrations**: SentenceTransformers, Scikit-learn, Google Gemini SDK, Celery, Redis.
- **Database Interactions**: Persists master record into `validation_results` and child rows into `validation_scores`, `evidence`, `competitors`, `recommendations`, and `audit_logs`.
- **Error Handling**: Full try/catch around external API calls with automatic degradation to heuristic mock provider; database rollbacks on failure.
- **Relationship with Other Modules**: Relies on Modules 4, 5, 6, 7, and 8 as internal pipeline stages; supplies data to Modules 9, 10, and 11.
- **Evidence of Implementation**: Verified by `backend/app/tests/test_integration.py` and `test_pipeline_intelligence.py` passing with 100% rate.

---

## Module 4: Dense Vector Embedding & Semantic Similarity Matcher

- **Module Name**: Semantic Vector Embedding & Competitor Retrieval Engine
- **Purpose**: Generates high-dimensional semantic representations of venture concepts and performs vector similarity search to identify overlapping ideas, detect market saturation, and discover potential competitors.
- **Inputs and Outputs**:
  - *Inputs*: Text string concatenation `"{title} {description}"`.
  - *Outputs*: 384-dimensional dense floating-point vector; Cosine similarity coefficient $[-1.0, 1.0]$; Competitor overlap classification (`HIGH_OVERLAP`, `MODERATE_OVERLAP`, `UNIQUE`).
- **Internal Processing**:
  - Checks `EmbeddingCacheService` (Redis / in-memory dictionary) using SHA-256 text hash.
  - If cache miss, executes `SentenceTransformer("all-MiniLM-L6-v2")` to compute embeddings.
  - Computes cosine similarity against all stored embeddings in the database:
    $$\text{sim}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$$
  - Multi-tenant tenant rule: If high overlap ($\ge 0.85$) belongs to another user, flags external competitor; if belongs to same user, flags duplicate idea submission.
  - Extracts top 5 intersecting keywords between concepts.
- **Algorithms / Business Rules**:
  - Overlap thresholds: $\ge 0.85$ (High Overlap), $\ge 0.72$ (Moderate Overlap), $< 0.72$ (Unique / Novel).
  - Caching strategy: SHA-256 hash keying with 7-day TTL in Redis.
- **Relevant Source Files and Functions**:
  - Backend: `backend/app/services/embedding_service.py` (`get_embedding:21-65`).
  - Backend Cache: `backend/app/services/embedding_cache_service.py` (`get:25`, `set:35`).
  - Backend Similarity: `backend/app/services/similarity_service.py` (`calculate_similarity:22-85`).
- **Dependencies & Integrations**: `sentence-transformers`, `scikit-learn`, `redis`.
- **Database Interactions**: Persists vector arrays in `embeddings` table (`vector` column stored as JSON array).
- **Error Handling**: Graceful fallback to deterministic mock embeddings during testing or if HuggingFace weights cannot be downloaded.
- **Relationship with Other Modules**: Serves as Layers 3 and 4 in Module 3 (Validation Pipeline).
- **Evidence of Implementation**: 6 dedicated automated unit tests in `backend/app/tests/test_similarity.py` passing with 100% rate.

---

## Module 5: Deterministic Rule Verification & Score Override Engine

- **Module Name**: Deterministic Rule Verification & Score Override Guardrail
- **Purpose**: Acts as an authoritative neuro-symbolic guardrail. Prevents hallucinated or overly generous LLM scores by enforcing domain logic, detecting fraud signals, and applying deterministic score caps.
- **Inputs and Outputs**:
  - *Inputs*: Raw LLM score dictionary and structured venture attributes.
  - *Outputs*: Verified score dictionary, list of applied overrides with justifications, and validation flags.
- **Internal Processing**:
  - **Rule 1 (Revenue Model Check)**: If the idea lacks an identified revenue model, caps `business_potential` at 45.0. If the founder explicitly rejects monetization (e.g., "don't want revenue"), caps score at 10.0.
  - **Rule 2 (Vague Customer Check)**: If target customer is unspecified or defined generically as "everyone" or "students", caps `target_customer_clarity` at 25.0.
  - **Rule 3 (Fraudulent Product Check)**: If idea claims impossible or deceptive traits ("magic", "invisible water", "guaranteed crore"), core scores are overridden to $\le 15.0$.
  - **Rule 4 (Anti-Marketing Stance)**: If founder refuses marketing/distribution, caps `market_demand` and `business_potential` at 20.0.
  - Overrides are recorded in `validation_results.score_overrides` with audit reasons.
- **Algorithms / Business Rules**:
  - Hard capping functions: `score = min(raw_score, cap_threshold)`.
  - Overrides directly decrement the confidence score in Module 7.
- **Relevant Source Files and Functions**:
  - Backend Rule Engine: `backend/app/services/rule_service.py` (`evaluate_rules:24-110`).
  - Backend Verification: `backend/app/services/verification_service.py` (`verify_scores:31-346`).
- **Dependencies & Integrations**: Python re, Pydantic.
- **Database Interactions**: Persisted in `validation_results.score_overrides` JSON column.
- **Error Handling**: If verification encounters unexpected missing keys, applies safe default neutral score (50.0) with audit warning.
- **Relationship with Other Modules**: Executes as Layer 8 in Module 3, transforming raw Layer 7 LLM scores before Layer 9 weighted aggregation.
- **Evidence of Implementation**: Verified by `test_benchmark.py` (specifically `test_invisible_water_idea_scores_very_low` and `test_scenario_1_vague_idea`) passing with 100% rate.

---

## Module 6: Authoritative 9-Dimension Scoring & 7-Parameter Visual Rollup

- **Module Name**: Dual-View Mathematical Scoring Engine
- **Purpose**: Computes an authoritative overall venture viability score (0–100) using normalized weights summing to 1.00, classifies the score into a 5-band rubric, and rolls up 9 backend dimensions into 7 visual founder parameters (1.0–10.0).
- **Inputs and Outputs**:
  - *Inputs*: 9 verified dimension scores (`market_demand`, `problem_solution_fit`, `target_customer_clarity`, `competition`, `uniqueness_innovation`, `technical_feasibility`, `business_potential`, `scalability`, `risk_level`).
  - *Outputs*: Overall Score (0.0–100.0), 5-band Classification, 7-Parameter Rollup Dictionary (1.0–10.0 scale).
- **Internal Processing**:
  - Computes weighted sum:
    $$\text{Overall Score} = \sum_{i=1}^{8} (S_i \times W_i) + [(100 - S_{\text{risk}}) \times W_{\text{risk}}]$$
  - Where the weights are:
    - Market Demand ($W_1 = 0.25$)
    - Problem-Solution Fit ($W_2 = 0.20$)
    - Target Customer Clarity ($W_3 = 0.10$)
    - Competition Environment ($W_4 = 0.10$)
    - Uniqueness & Innovation ($W_5 = 0.10$)
    - Technical Feasibility ($W_6 = 0.10$)
    - Business Potential ($W_7 = 0.10$)
    - Scalability ($W_8 = 0.03$)
    - Risk Level ($W_9 = 0.02$)
    - $\sum W_i = 1.00$ ($100\%$)
  - Rolls up into 7 frontend parameters:
    1. `marketDemand` = $S_1 / 10$
    2. `problemSeverity` = $S_2 / 10$
    3. `competition` = $S_4 / 10$
    4. `targetCustomer` = $S_3 / 10$
    5. `innovation` = $S_5 / 10$
    6. `feasibility` = $S_6 / 10$
    7. `revenuePotential` = $S_7 / 10$
  - Categorizes overall score into 5 bands:
    - $\ge 90$: `EXCEPTIONAL` (Highly Promising)
    - $75 - 89.9$: `STRONG` (Promising)
    - $60 - 74.9$: `MODERATE` (Moderate Viability)
    - $40 - 59.9$: `WEAK` (Needs Improvement)
    - $< 40$: `VERY_WEAK` (High Risk)
- **Relevant Source Files and Functions**:
  - Backend: `backend/app/services/scoring_service.py` (`calculate_overall_score:25-95`, `rollup_to_seven_parameters:98-135`).
  - Frontend Utilities: `frontend/src/utils/scoreUtils.ts` (`normalizeScore`, `getScoreCategory`, `formatScoreDisplay`).
  - Frontend Charts: `frontend/src/components/ScoreGauge.tsx`, `frontend/src/components/RadarChartWidget.tsx`, `ParameterProgress.tsx`.
- **Dependencies & Integrations**: Recharts, SVG graphics.
- **Database Interactions**: Persists individual dimensions in `validation_scores` table (9 rows per validation).
- **Error Handling**: Numerical clamping `max(0.0, min(100.0, score))` guarantees bounds integrity.
- **Relationship with Other Modules**: Executes as Layer 9 in Module 3; feeds visual chart state in Modules 10 and 11.
- **Evidence of Implementation**: 8 automated tests in `backend/app/tests/test_scoring.py` passing with 100% rate.

---

## Module 7: Multi-Factor Calibrated Confidence Engine

- **Module Name**: Multi-Factor Confidence Calibration Engine
- **Purpose**: Quantifies the statistical confidence and reliability of the validation report (0–100%), taking into account input data completeness, external evidence quality, model agreement, and rule consistency, with rigorous penalties for degradation or overrides.
- **Inputs and Outputs**:
  - *Inputs*: Completeness score, evidence count and classification, verification override list, model provider (`gemini` vs `mock`), input text length.
  - *Outputs*: Calibrated Confidence Score (0.0–100.0%) and structured breakdown dictionary.
- **Internal Processing**:
  - Calculates base confidence:
    $$\text{Base} = (0.35 \times \text{Completeness}) + (0.35 \times \text{Model Agreement}) + (0.15 \times \text{Evidence Quality}) + (0.15 \times \text{Rule Consistency})$$
  - Applies deterministic deductions:
    - $-5.0\%$ per Layer 8 score override.
    - $-15.0\%$ if zero external benchmark evidence is found (or $-12.0\%$ if all evidence is synthetic).
    - $-20.0\%$ if operating on `MockProvider` fallback.
    - $-15.0\%$ if input description is under 150 characters (or $-8.0\%$ if under 300 characters).
  - Enforces a hard ceiling of $40.0\%$ maximum confidence when running in degraded mock mode.
- **Relevant Source Files and Functions**:
  - Backend: `backend/app/services/confidence_service.py` (`calculate_confidence:37-159`).
- **Dependencies & Integrations**: Pydantic, Python math.
- **Database Interactions**: Saved to `validation_results.confidence_score` and `validation_results.confidence_breakdown`.
- **Error Handling**: Clamped strictly to $[0.0, 100.0]$.
- **Relationship with Other Modules**: Executes as Layer 10 in Module 3; displayed beside the score gauge in reports.
- **Evidence of Implementation**: Unit test in `backend/app/tests/test_confidence.py` passing with 100% rate.

---

## Module 8: Strategic Diagnosis, Root Cause & Recommendation Engine

- **Module Name**: Strategic Defect Diagnosis & Recommendation Synthesizer
- **Purpose**: Translates raw numerical scores into actionable venture engineering guidance. Diagnoses structural root causes for low scores, identifies information gaps, generates concrete mitigation experiments, ranks top-3 critical actions, and predicts score improvements.
- **Inputs and Outputs**:
  - *Inputs*: Verified dimension scores, extracted venture attributes, and identified weaknesses.
  - *Outputs*: Information gaps list, root-cause diagnostics, ranked recommendations (with priority `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), top-3 immediate action items, and predicted score gains.
- **Internal Processing**:
  - *Layer 11*: Identifies missing unit economics, pricing elasticity, or customer acquisition strategy.
  - *Layer 12*: Maps weak sub-scores to operational defects (e.g., low feasibility due to unproven deep-tech dependencies).
  - *Layer 13*: Formulates Lean Startup experiments (e.g., "Build a landing page with email capture to validate customer willingness to pay").
  - *Layer 14*: Evaluates severity vs effort to surface top-3 prioritized actions.
  - *Layer 15*: Calculates anticipated score gains ($+3.5$ to $+8.0$ points) upon successful execution of mitigations.
- **Relevant Source Files and Functions**:
  - Backend: `backend/app/services/recommendation_engine_service.py` (`diagnose_root_causes:17-50`, `prioritize_actions:52-95`, `predict_impact:98-138`).
  - Backend Router: `backend/app/api/reports.py` (`toggle_recommendation_status:165`).
  - Frontend UI: `frontend/src/pages/ReportResultPage.tsx` (Interactive recommendation checklist with status toggles).
- **Dependencies & Integrations**: Pydantic, SQLAlchemy.
- **Database Interactions**: Persists rows in `recommendations` table with status `OPEN` or `COMPLETED`.
- **Error Handling**: Graceful fallback to heuristic templates if LLM output does not match expected schema.
- **Relationship with Other Modules**: Executes as Layers 11–15 in Module 3; rendered on Report and Dashboard pages.
- **Evidence of Implementation**: 14 automated unit and integration tests in `backend/app/tests/test_recommendation_pipeline.py` passing with 100% rate.

---

## Module 9: Multi-Idea Comparative Synthesis Matrix

- **Module Name**: Multi-Venture Comparative Benchmarking Matrix
- **Purpose**: Enables founders and incubators to select between 2 and 4 validated startup ideas and generate a side-by-side comparative analysis across all 7 parameters, featuring overlaid radar chart polygons and AI strategic trade-off synthesis.
- **Inputs and Outputs**:
  - *Inputs*: Payload `{ idea_ids: [int, int, ...] }` (Length: 2 to 4).
  - *Outputs*: Multi-idea comparison matrix, winner/leader ranking, parameter-by-parameter delta breakdown, and executive trade-off narrative.
- **Internal Processing**:
  - Validates constraints: Enforces $2 \le \text{count} \le 4$; verifies all ideas belong to the requesting user and possess completed validation reports.
  - Assembles unified 7-parameter comparison table.
  - Executes LLM synthesis prompt comparing relative moats, execution complexities, and capital requirements.
  - Falls back to heuristic comparative generator if external LLM is offline.
- **Relevant Source Files and Functions**:
  - Backend: `backend/app/api/comparisons.py` (`compare_ideas:88-215`, `_generate_comparison_analysis:44-75`).
  - Frontend Page: `frontend/src/pages/CompareIdeasPage.tsx`.
- **Dependencies & Integrations**: Recharts (multi-polygon radar chart), Google Gemini SDK.
- **Database Interactions**: Reads `ideas`, `validation_results`, and `validation_scores`.
- **Error Handling**: Returns HTTP 400 if $<2$ or $>4$ ideas provided, HTTP 403 if attempting to compare ideas owned by another user, HTTP 422 if an idea lacks a validation report.
- **Relationship with Other Modules**: Consumes validation results produced by Module 3.
- **Evidence of Implementation**: 4 automated tests in `backend/app/tests/test_comparison_and_dashboard.py` passing with 100% rate.

---

## Module 10: Idea History, Versioning & Delta Tracking

- **Module Name**: Venture Versioning & Historical Delta Engine
- **Purpose**: Manages the evolutionary lifecycle of startup ideas. Ensures immutability of historical validation reports by creating incremented versions (`v1` $\rightarrow$ `v2`) upon revalidation and calculating parameter deltas ($+0.4$ points) to visualize founder progress over time.
- **Inputs and Outputs**:
  - *Inputs*: Idea identifier and updated venture context.
  - *Outputs*: New immutable `ValidationResult` row (version incremented by 1), score delta summary, and resolved recommendation audit.
- **Internal Processing**:
  - Revalidation never updates or overwrites previous `validation_results` rows.
  - Fetches latest version number $N$ and assigns $N+1$ to the new run.
  - Computes score differences across all parameters: $\Delta S = S_{v2} - S_{v1}$.
  - Supports soft-deletion (`is_deleted = True`) to preserve referential integrity for historical comparisons.
- **Relevant Source Files and Functions**:
  - Backend: `backend/app/api/ideas.py` (`create_idea:35`, `update_idea:72`, `revalidate_idea:155`, `delete_idea:185`).
  - Backend History Router: `backend/app/api/history.py` (`get_idea_history:18-50`).
  - Frontend Pages: `frontend/src/pages/MyIdeasPage.tsx`, `frontend/src/pages/ReportResultPage.tsx` (Version dropdown switcher).
- **Dependencies & Integrations**: SQLAlchemy ORM.
- **Database Interactions**: Manages `ideas.version` and `validation_results.version`.
- **Error Handling**: Optimistic concurrency control prevents duplicate version collisions.
- **Relationship with Other Modules**: Interlinks Module 2 (chat inception) with Module 3 (pipeline execution) and Module 11 (dashboard).
- **Evidence of Implementation**: Tested extensively in `test_integration.py` (`test_revalidation_creates_new_row_not_update` and `test_version_comparison_returns_delta`) passing with 100% rate.

---

## Module 11: Founder & Administrative Telemetry Dashboard

- **Module Name**: Platform Observability & Analytical Dashboard
- **Purpose**: Delivers aggregated analytics and business intelligence across two user tiers:
  1. *Founder Dashboard*: Tracks portfolio venture count, total validations, average viability score, score distribution, and timeline trends.
  2. *Institutional Admin Portal*: Monitors institution-wide student user growth, validation volume, pipeline execution latency, LLM fallback rate, and venture governance.
- **Inputs and Outputs**:
  - *Inputs*: Authenticated user session or admin credentials.
  - *Outputs*: Summary metrics JSON, score history array, category breakdown counts, and layer-by-layer latency profiles.
- **Internal Processing**:
  - SQL aggregate functions (`COUNT`, `AVG`) grouped by user and classification category.
  - Admin metrics endpoint aggregates telemetry across `audit_logs` and `pipeline_timing` dictionaries.
  - Enforces `require_admin` dependency for all institutional governance endpoints.
- **Relevant Source Files and Functions**:
  - Backend Founder Dashboard: `backend/app/api/dashboard.py` (`get_dashboard_stats:18-85`, `get_score_history:88-115`).
  - Backend Admin Portal: `backend/app/api/admin.py` (`get_admin_metrics:21-120`, `list_all_users:125-180`, `list_all_ideas:185-240`).
  - Frontend Pages: `frontend/src/pages/DashboardPage.tsx`, `frontend/src/pages/admin/AdminDashboardPage.tsx`.
- **Dependencies & Integrations**: Recharts (LineChart, BarChart, PieChart), Lucide icons.
- **Database Interactions**: Aggregates `ideas`, `validation_results`, `users`, and `audit_logs`.
- **Error Handling**: Non-admin access attempts to admin endpoints return HTTP 403 Forbidden.
- **Relationship with Other Modules**: Aggregates output data from all platform modules.
- **Evidence of Implementation**: Verified by `test_comparison_and_dashboard.py` and `test_architectural_tasks.py` (`test_admin_metrics_rejects_non_admin`) passing with 100% rate.
