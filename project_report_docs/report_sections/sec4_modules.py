# project_report_docs/report_sections/sec4_modules.py
from .helpers import (
    add_chapter_title, add_section, add_subsection, add_p, add_bullet,
    create_styled_table, add_figure_placeholder, add_code_block
)

def build_chapter4(doc):
    add_chapter_title(doc, "Chapter 4", "Proposed System and Functional Modules")
    
    # Unnumbered brief introduction
    add_p(doc, "The CheckStart AI platform is engineered as a modular, highly cohesive, and loosely coupled system partitioned into eleven (11) distinct functional modules. Each module encapsulates a specific domain responsibility—spanning identity security, conversational natural language processing, vector similarity matching, neuro-symbolic guardrail enforcement, mathematical scoring, recommendation synthesis, and platform observability. This chapter provides an exhaustive technical analysis of every implemented module, detailing its architectural purpose, inputs and outputs, internal algorithms, source code file references, database interactions, error-handling mechanisms, and verification evidence.")

    # 4.1 System Overview and Design Rationale
    add_section(doc, "4.1 System Overview and Design Rationale")
    add_p(doc, "The architecture adheres strictly to the Service-Repository pattern, separating presentation logic, HTTP routing, business domain logic, and data access into isolated layers. This separation ensures that mathematical scoring formulas and verification guardrails can be unit-tested in isolation without launching HTTP servers or spinning up user interfaces.")
    
    trace_headers = ["Module #", "Module Functional Domain", "Primary Source Code Files", "Key Exported Functions / Classes", "Implementation Status"]
    trace_data = [
        ["Mod 1", "Authentication & RBAC", "app/api/auth.py, app/core/security.py", "register_user, login_for_access_token, google_auth", "Fully Implemented (8 Tests Passed)"],
        ["Mod 2", "Conversational Socratic Assistant", "app/services/chat_service.py, app/api/sessions.py", "ChatService, process_message, extract_entities", "Fully Implemented (8 Tests Passed)"],
        ["Mod 3", "15-Layer Validation Pipeline", "app/services/validation_service.py, tasks.py", "ValidationService, run_validation_pipeline", "Fully Implemented (15 Tests Passed)"],
        ["Mod 4", "Vector Embedding & Similarity", "app/services/embedding_service.py, similarity.py", "EmbeddingService, SimilarityService, MiniLM", "Fully Implemented (6 Tests Passed)"],
        ["Mod 5", "Deterministic Rule Overrides", "app/services/rule_service.py, verification.py", "RuleService, VerificationService, verify_scores", "Fully Implemented (5 Tests Passed)"],
        ["Mod 6", "Authoritative 9-Dim Scoring", "app/services/scoring_service.py", "ScoringService, calculate_overall_score", "Fully Implemented (8 Tests Passed)"],
        ["Mod 7", "Calibrated Confidence Engine", "app/services/confidence_service.py", "ConfidenceService, calculate_confidence", "Fully Implemented (1 Test Passed)"],
        ["Mod 8", "Strategic Recommendation Engine", "app/services/recommendation_engine_service.py", "diagnose_root_causes, prioritize_actions", "Fully Implemented (14 Tests Passed)"],
        ["Mod 9", "Multi-Idea Comparison Matrix", "app/api/comparisons.py", "compare_ideas, _generate_comparison_analysis", "Fully Implemented (4 Tests Passed)"],
        ["Mod 10", "Idea History & Versioning", "app/api/ideas.py, app/api/history.py", "revalidate_idea, get_idea_history, version_diff", "Fully Implemented (5 Tests Passed)"],
        ["Mod 11", "Observability & Dashboards", "app/api/dashboard.py, app/api/admin.py", "get_dashboard_stats, get_admin_metrics", "Fully Implemented (6 Tests Passed)"],
    ]
    create_styled_table(doc, trace_headers, trace_data, col_widths=[0.8, 1.8, 2.0, 2.0, 1.4], table_num="4.1", caption="Functional Module Implementation Traceability Matrix")

    # 4.2 Module 1: User Authentication, RBAC, and Profile Management
    add_section(doc, "4.2 Module 1: User Authentication, RBAC, and Profile Management")
    add_p(doc, "Module 1 establishes identity, access control, and collegiate founder demographics. Implemented in backend/app/api/auth.py:57-340 and backend/app/core/security.py, the module supports dual authentication pathways: standard email/password registration with salted bcrypt hashing and Google Identity Services (GIS) One Tap sign-in.")
    add_bullet(doc, "Inputs: UserRegister payload (name, email, password, college, course, graduationYear) or UserLogin credentials. Outputs: JSON envelope containing HMAC-SHA256 JWT access token and sanitized User schema.", "Data Contracts: ")
    add_bullet(doc, "Enforces minimum 6-character passwords; hashes passwords via passlib.context.CryptContext(schemes=['bcrypt']); encodes JWT tokens with subject claim sub=user.id and role.", "Internal Algorithms: ")
    add_bullet(doc, "Queries users, user_profiles, and user_preferences tables. Enforces unique constraints on email and google_sub.", "Database Interactions: ")
    add_bullet(doc, "SlowAPI restricts registration and login routes to 5 requests per minute per IP. Duplicate emails return HTTP 409 Conflict. Invalid passwords return HTTP 401 Unauthorized with normalized error envelope.", "Error Handling: ")
    add_bullet(doc, "8 unit tests in backend/app/tests/test_auth.py pass with 100% rate.", "Verification Evidence: ")

    # 4.3 Module 2: Conversational Idea Inception and Socratic Mentorship
    add_section(doc, "4.3 Module 2: Conversational Idea Inception and Socratic Mentorship")
    add_p(doc, "Module 2 delivers an interactive Socratic coaching experience where collegiate founders can pitch ideas in natural dialogue without being forced to fill out rigid multi-field forms. Implemented in backend/app/services/chat_service.py and backend/app/api/sessions.py, the module extracts structured venture attributes incrementally across multi-turn exchanges.")
    add_bullet(doc, "Inputs: Chat message string, session_id (UUID), and client_message_id (UUID). Outputs: Socratic assistant reply, updated completeness score (0-100%), list of extracted entities, and turn-1 validation trigger status.", "Data Contracts: ")
    add_bullet(doc, "Evaluates client_message_id to guarantee idempotency on network retries. Scans lexical regex patterns to detect and quarantine prompt injection attempts. Evaluates missing attributes to generate 1-2 focused clarifying questions.", "Internal Processing: ")
    add_bullet(doc, "Calculates completeness: Completeness = (0.25 * Problem) + (0.20 * Solution) + (0.20 * Customer) + (0.15 * Industry) + (0.20 * BusinessModel).", "Completeness Formula: ")
    add_bullet(doc, "Reads and updates validation_sessions; appends user and assistant dialogue turns to conversation_messages.", "Database Interactions: ")
    add_bullet(doc, "8 unit tests in backend/app/tests/test_chat_service.py pass with 100% rate.", "Verification Evidence: ")

    # 4.4 Module 3: 15-Layer Validation Pipeline Orchestration Engine
    add_section(doc, "4.4 Module 3: 15-Layer Validation Pipeline Orchestration Engine")
    add_p(doc, "Module 3 coordinates the sequential execution of all fifteen evaluation layers. Implemented in backend/app/services/validation_service.py:42-390, the orchestrator accepts structured venture context, coordinates internal services, captures layer execution durations in milliseconds, and commits results to relational storage.")
    add_bullet(doc, "Inputs: IdeaProfile dictionary containing title, description, problem, solution, customer, industry, business model, pricing. Outputs: Comprehensive ValidationResult object with 9 verified scores, 7 visual rollups, confidence breakdown, competitors, recommendations, and timing telemetry.", "Data Contracts: ")
    add_bullet(doc, "Sequential execution pipeline: Layers 1 to 15 execute synchronously for on-demand UI requests (/api/validation/analyze/{id}) or as asynchronous Celery tasks queued via Redis (tasks.py:run_validation_pipeline_task).", "Execution Modes: ")
    add_bullet(doc, "Persists master record to validation_results; child records to validation_scores (9 rows), evidence, competitors, recommendations, and audit_logs.", "Database Interactions: ")
    add_bullet(doc, "Full try/except wrapping external API calls; automatic fallback to MockProvider on Gemini failure; database rollbacks on persistence exceptions.", "Error Handling: ")
    add_bullet(doc, "Verified by test_integration.py and test_pipeline_intelligence.py passing with 100% rate.", "Verification Evidence: ")

    # 4.5 Module 4: Dense Vector Embedding and Semantic Competitor Retrieval
    add_section(doc, "4.5 Module 4: Dense Vector Embedding and Semantic Competitor Retrieval")
    add_p(doc, "Module 4 transforms text concepts into 384-dimensional dense vectors and performs cosine distance matching to detect conceptual overlap against peer ideas and incumbent competitors. Implemented in embedding_service.py:21-65, similarity_service.py:22-85, and embedding_cache_service.py:25-50.")
    add_bullet(doc, "Inputs: Concatenated string '{title} {description}'. Outputs: 384-dimensional dense float vector, cosine similarity score [-1.0, 1.0], overlap classification (HIGH_OVERLAP, MODERATE_OVERLAP, UNIQUE), top 5 shared keywords.", "Data Contracts: ")
    add_bullet(doc, "Computes SHA-256 hash of text; checks Redis cache; on miss, runs SentenceTransformer('all-MiniLM-L6-v2') on local CPU. Computes cosine distance against database vectors. Tags similarity >= 0.85 as high competitor overlap.", "Internal Algorithms: ")
    add_bullet(doc, "Persists vector arrays in embeddings table (JSON array column).", "Database Interactions: ")
    add_bullet(doc, "6 automated unit tests in backend/app/tests/test_similarity.py pass with 100% rate.", "Verification Evidence: ")

    # 4.6 Module 5: Deterministic Rule Verification and Score Override Engine
    add_section(doc, "4.6 Module 5: Deterministic Rule Verification and Score Override Engine")
    add_p(doc, "Module 5 is the primary neuro-symbolic anti-flattery guardrail. Implemented in rule_service.py:24-110 and verification_service.py:31-346, the module intercepts raw LLM scores produced by Layer 7 and enforces domain caps before weighted scoring.")
    add_bullet(doc, "Inputs: Raw LLM score dictionary and IdeaProfile. Outputs: Verified score dictionary, list of applied score overrides with audit justifications.", "Data Contracts: ")
    add_bullet(doc, "Evaluates Rule 1 (caps business_potential at 45.0 if monetization missing), Rule 1b (caps at 10.0 if revenue rejected), Rule 2 (caps customer at 25.0 if target is 'everyone'), Rule 3 (caps fraud concepts at <=15.0), Rule 4 (caps demand at 20.0 if marketing refused).", "Internal Processing: ")
    add_bullet(doc, "Persists applied overrides in validation_results.score_overrides JSON column.", "Database Interactions: ")
    add_bullet(doc, "Verified in test_benchmark.py (specifically test_invisible_water_idea_scores_very_low and test_scenario_1_vague_idea) passing with 100% rate.", "Verification Evidence: ")

    # 4.7 Module 6: Authoritative 9-Dimension Scoring and Visual Rollup
    add_section(doc, "4.7 Module 6: Authoritative 9-Dimension Scoring and Visual Rollup")
    add_p(doc, "Module 6 computes the overall venture viability score (0–100) using normalized weights summing to exactly 1.000, and rolls up backend dimensions to 7 visual parameters for founder display. Implemented in backend/app/services/scoring_service.py:25-135.")
    add_bullet(doc, "Inputs: 9 verified sub-scores. Outputs: Overall Viability Score (0.0-100.0), 5-band Classification Tier, 7-Parameter Visual Rollup Dictionary (1.0-10.0 scale).", "Data Contracts: ")
    add_bullet(doc, "Applies authoritative weights: Market Demand 0.25, Problem-Solution Fit 0.20, Customer 0.10, Competition 0.10, Uniqueness 0.10, Feasibility 0.10, Business 0.10, Scalability 0.03, Inverted Risk 0.02. Clamps all outputs strictly to [0.0, 100.0].", "Mathematical Algorithms: ")
    add_bullet(doc, "Persists individual sub-scores into validation_scores (9 rows per validation).", "Database Interactions: ")
    add_bullet(doc, "8 automated unit tests in backend/app/tests/test_scoring.py pass with 100% rate.", "Verification Evidence: ")

    # 4.8 Module 7: Multi-Factor Calibrated Confidence Engine
    add_section(doc, "4.8 Module 7: Multi-Factor Calibrated Confidence Engine")
    add_p(doc, "Module 7 quantifies the statistical reliability of the validation report (0–100%), incorporating data completeness, model agreement, evidence provenance, and rule consistency. Implemented in confidence_service.py:37-159.")
    add_bullet(doc, "Inputs: Completeness score, evidence count and classification, override count, model provider, text character length. Outputs: Calibrated Confidence Score (0.0-100.0%) and structured breakdown.", "Data Contracts: ")
    add_bullet(doc, "Calculates base confidence: C_base = 0.35*C_comp + 0.35*C_agree + 0.15*C_evid + 0.15*C_rule. Deducts 5.0 per override, 15.0 for zero evidence, 20.0 for mock mode, 15.0 for text <150 chars. Enforces 40.0% ceiling in mock mode.", "Mathematical Logic: ")
    add_bullet(doc, "Persisted in validation_results.confidence_score and confidence_breakdown.", "Database Interactions: ")
    add_bullet(doc, "Verified in test_confidence.py passing with 100% rate.", "Verification Evidence: ")

    # 4.9 Module 8: Strategic Diagnosis, Root Cause, and Recommendation Engine
    add_section(doc, "4.9 Module 8: Strategic Diagnosis, Root Cause, and Recommendation Engine")
    add_p(doc, "Module 8 transforms numerical scores into actionable venture engineering guidance. Implemented in recommendation_engine_service.py:17-138 and reports.py:165, the module diagnoses root causes for low scores, generates Lean Startup experiments, ranks top-3 actions, and predicts potential score gains.")
    add_bullet(doc, "Inputs: Verified sub-scores, extracted profile, and identified weaknesses. Outputs: Information gaps, root cause diagnostics, prioritized recommendations (CRITICAL, HIGH, MED, LOW), Top-3 Actions, and predicted score gains (+3.5 to +8.0 pts).", "Data Contracts: ")
    add_bullet(doc, "Maps weak sub-scores to operational defects; generates MVP experiments; evaluates severity vs effort matrix; caps cumulative predicted gain at 25.0 points.", "Internal Logic: ")
    add_bullet(doc, "Persists rows into recommendations table with status OPEN or COMPLETED.", "Database Interactions: ")
    add_bullet(doc, "14 automated unit and integration tests in test_recommendation_pipeline.py pass with 100% rate.", "Verification Evidence: ")

    # 4.10 Module 9: Multi-Idea Comparative Synthesis Matrix
    add_section(doc, "4.10 Module 9: Multi-Idea Comparative Synthesis Matrix")
    add_p(doc, "Module 9 enables collegiate founders and incubators to select between 2 and 4 validated startup ideas and generate a side-by-side comparative analysis. Implemented in backend/app/api/comparisons.py:88-215 and frontend/src/pages/CompareIdeasPage.tsx.")
    add_bullet(doc, "Inputs: JSON payload { idea_ids: [int, int, ...] } (Length: 2 to 4). Outputs: Multi-idea parameter matrix, leader ranking, parameter delta comparisons, and AI trade-off synthesis narrative.", "Data Contracts: ")
    add_bullet(doc, "Enforces 2 <= count <= 4; verifies all ideas belong to the requesting user and possess validated reports. Dispatches comparative prompt to Gemini Pro (with heuristic fallback).", "Internal Processing: ")
    add_bullet(doc, "Reads ideas, validation_results, and validation_scores.", "Database Interactions: ")
    add_bullet(doc, "4 automated tests in test_comparison_and_dashboard.py pass with 100% rate.", "Verification Evidence: ")

    # 4.11 Module 10: Idea History, Versioning, and Delta Tracking Engine
    add_section(doc, "4.11 Module 10: Idea History, Versioning, and Delta Tracking Engine")
    add_p(doc, "Module 10 manages the evolutionary lifecycle of startup ideas. Implemented in backend/app/api/ideas.py and backend/app/api/history.py, the module ensures immutability of historical validation reports by creating incremented versions (v1 -> v2) upon re-evaluation.")
    add_bullet(doc, "Inputs: Idea identifier and updated venture context. Outputs: New immutable ValidationResult row (version incremented by 1), score delta summary, and resolved recommendation audit.", "Data Contracts: ")
    add_bullet(doc, "Re-validation never updates or overwrites previous rows; assigns version N+1. Calculates score deltas: Delta S = S_new - S_prev. Supports soft-deletion (is_deleted = True).", "Internal Logic: ")
    add_bullet(doc, "Updates ideas.version; inserts new validation_results record.", "Database Interactions: ")
    add_bullet(doc, "5 automated tests in test_integration.py and test_ideas.py pass with 100% rate.", "Verification Evidence: ")

    # 4.12 Module 11: Founder and Administrative Telemetry Dashboard
    add_section(doc, "4.12 Module 11: Founder and Administrative Telemetry Dashboard")
    add_p(doc, "Module 11 delivers aggregated business intelligence across two user tiers: the Founder Dashboard (tracking venture counts, score history, and recent validations) and the Administrative Portal (monitoring platform user growth, layer latency telemetry, and score distribution). Implemented in dashboard.py:18-115 and admin.py:21-240.")
    add_bullet(doc, "Inputs: Authenticated user session or admin credentials. Outputs: Summary metrics JSON, score history array, category breakdown counts, and layer-by-layer latency profiles.", "Data Contracts: ")
    add_bullet(doc, "Executes SQL aggregations (COUNT, AVG); aggregates pipeline_timing dictionaries; enforces require_admin dependency on institutional routes.", "Internal Logic: ")
    add_bullet(doc, "Aggregates ideas, validation_results, users, and audit_logs.", "Database Interactions: ")
    add_bullet(doc, "6 automated tests in test_comparison_and_dashboard.py and test_architectural_tasks.py pass with 100% rate.", "Verification Evidence: ")

    # 4.13 User Interface Design and Component Hierarchy
    add_section(doc, "4.13 User Interface Design and Component Hierarchy")
    add_p(doc, "The frontend single-page application is structured into public marketing views, protected founder workspace views, and protected administrative governance views.")
    
    add_figure_placeholder(doc, "4.1", "React Component Hierarchy and State Flow Architecture", 
        "Tree diagram showing root App mounting BrowserRouter, AuthProvider, and ThemeProvider, routing to public views (Login, Register), protected founder views (Dashboard, Validate, ReportResult, Compare), and protected admin views (AdminDashboard, AdminUsers).")
    
    # 4.14 Inter-Module Data Flow and Error Handling
    add_section(doc, "4.14 Inter-Module Data Flow and Error Handling")
    add_p(doc, "Communication between modules is strictly managed through Pydantic data contracts and SQLAlchemy database transactions. Table 4.2 presents the complete REST API inventory connecting the frontend single-page application to backend services.")

    api_headers = ["HTTP Method", "Canonical Endpoint Path", "Auth Guard", "Target Service & File", "Response Data & Purpose"]
    api_data = [
        ["POST", "/api/v1/auth/register", "None (Rate 5/min)", "auth.py:57", "User registration; returns JWT token + user profile."],
        ["POST", "/api/v1/auth/login", "None (Rate 5/min)", "auth.py:101", "Bcrypt login; returns JWT token + user profile."],
        ["POST", "/api/v1/auth/google", "None", "auth.py:165", "Google GIS SSO sign-in; auto-provisions user."],
        ["POST", "/api/v1/auth/admin/login", "None", "auth.py:253", "Administrative login; verifies role == 'ADMIN'."],
        ["GET", "/api/v1/auth/me", "Bearer Token", "auth.py:285", "Returns current authenticated user details and portfolio counts."],
        ["POST", "/api/v1/conversations", "Bearer Token", "sessions.py:35", "Creates new ValidationSession; returns session object."],
        ["POST", "/api/v1/conversations/{id}/messages", "Bearer (Rate 30/min)", "sessions.py:75", "Processes chat message; extracts entities, returns AI reply."],
        ["POST", "/api/v1/conversations/{id}/validate", "Bearer (Rate 15/min)", "sessions.py:124", "Triggers 15-layer pipeline from chat context; returns report ID."],
        ["GET", "/api/v1/ideas", "Bearer Token", "ideas.py:25", "Lists user ideas with search, category filters, and pagination."],
        ["POST", "/api/v1/ideas", "Bearer Token", "ideas.py:55", "Creates new startup idea record in database."],
        ["POST", "/api/v1/ideas/{id}/revalidate", "Bearer Token", "ideas.py:155", "Increments version (v1->v2), triggers re-validation pipeline."],
        ["POST", "/api/v1/ideas/compare", "Bearer Token", "comparisons.py:88", "Compares 2 to 4 validated ideas across 7 parameters."],
        ["POST", "/api/v1/validation/analyze/{id}", "Bearer Token", "validation.py:110", "Executes synchronous validation pipeline; returns report."],
        ["GET", "/api/v1/reports/{id}", "Bearer Token", "reports.py:35", "Retrieves interactive report with 7 parameters and confidence."],
        ["GET", "/api/v1/dashboard/stats", "Bearer Token", "dashboard.py:18", "Returns founder portfolio summary metrics and score history."],
        ["GET", "/api/v1/admin/metrics", "Admin Role", "admin.py:21", "Returns system telemetry: layer latencies, user growth curves."],
    ]
    create_styled_table(doc, api_headers, api_data, col_widths=[0.9, 1.8, 1.2, 1.2, 2.1], table_num="4.2", caption="REST API Endpoint Inventory and Protocol Contracts")

    # 4.15 Chapter Summary
    add_section(doc, "4.15 Chapter Summary")
    add_p(doc, "This chapter presented an exhaustive technical breakdown of all eleven functional software modules composing CheckStart AI, detailing their data contracts, algorithms, source files, line numbers, and error handling mechanisms. The REST API inventory and component hierarchy were documented. Chapter 5 presents the empirical experimental results, benchmark discrimination findings, latency telemetry, and cost-benefit evaluations.")
    print("Chapter 4 built successfully.")
