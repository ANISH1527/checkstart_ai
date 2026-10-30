# project_report_docs/report_sections/sec3_methodology.py
from .helpers import (
    add_chapter_title, add_section, add_subsection, add_subsubsection,
    add_p, add_bullet, add_callout, create_styled_table, add_figure_placeholder
)

def build_chapter3(doc):
    add_chapter_title(doc, "Chapter 3", "Objectives and Methodology")
    
    # Unnumbered brief introduction
    add_p(doc, "The development of CheckStart AI requires a rigorous, multi-disciplinary engineering methodology combining natural language processing, vector similarity indexing, deterministic rule enforcement, generative artificial intelligence, and asynchronous full-stack systems engineering. This chapter presents an exhaustive architectural and methodological specification of the platform, detailing the measurable engineering objectives, system workflow, multi-tier software architecture, the 15-layer sequential validation pipeline, the authoritative mathematical scoring model, semantic similarity algorithms, deterministic verification guardrails, database entity relationships, REST API design, and empirical verification strategies.")

    # 3.1 Measurable Objectives of the Proposed Work
    add_section(doc, "3.1 Measurable Objectives of the Proposed Work")
    add_p(doc, "To ensure that the engineering contributions can be evaluated objectively against verifiable implementation evidence, the following ten (10) measurable engineering objectives were formulated:")
    add_bullet(doc, "Construct a multi-turn conversational AI mentor powered by Socratic dialogue heuristics that automatically parses unstructured concept pitches, extracts essential venture entities (problem, solution, customer, industry, business model, pricing), and tracks data completeness on a normalized 0–100% scale.", "Objective 1 (Conversational Socratic Inception): ")
    add_bullet(doc, "Design and implement an automated 15-layer sequential validation pipeline coordinating natural language processing, sentence embeddings, semantic distance matching, deterministic rule checking, LLM prompting, score verification, and strategic recommendation synthesis.", "Objective 2 (15-Layer Sequential Pipeline Orchestration): ")
    add_bullet(doc, "Integrate local dense vector embeddings using the all-MiniLM-L6-v2 model (384 dimensions) and cosine distance search, backed by an SHA-256 Redis caching layer, to detect semantic overlap and identify competitor ventures in sub-50 milliseconds.", "Objective 3 (Dense Vector Competitor Matching): ")
    add_bullet(doc, "Implement a lexical regex scanner and input boundary filter at the API gateway to detect and quarantine adversarial prompt injection tokens (e.g., 'ignore previous instructions', 'DAN mode') without leaking system context.", "Objective 4 (Prompt Injection & Adversarial Defense): ")
    add_bullet(doc, "Engineer deterministic Layer 8 post-LLM score verification guardrails that intercept raw generative model outputs and apply strict mathematical score caps when revenue models are missing, target customers are vague, or deceptive claims are detected.", "Objective 5 (Deterministic Anti-Sycophancy Guardrails): ")
    add_bullet(doc, "Formulate an authoritative 9-dimension weighted viability scoring engine with normalized weights summing to exactly 1.000 (Market Demand 25%, Problem-Solution Fit 20%, Target Customer 10%, Competition 10%, Uniqueness 10%, Feasibility 10%, Business Potential 10%, Scalability 3%, Inverted Risk 2%), mapped to 7 visual founder parameters (1.0–10.0 scale) and a 5-tier classification rubric.", "Objective 6 (Authoritative Mathematical Scoring Engine): ")
    add_bullet(doc, "Formulate a multi-factor confidence calibration engine combining completeness, model agreement, evidence provenance, and rule consistency, applying deterministic penalty deductions for score overrides, missing citations, and mock degradation.", "Objective 7 (Multi-Factor Calibrated Confidence Engine): ")
    add_bullet(doc, "Construct an automated recommendation engine that diagnoses structural root causes for low scores, prioritizes top-3 immediate Lean Startup experiments, and predicts expected score gains (+3.5 to +8.0 points) upon successful mitigation.", "Objective 8 (Root Cause Diagnosis & Recommendation Synthesis): ")
    add_bullet(doc, "Establish an immutable versioning engine (v1 -> v2) that preserves historical validation audits upon re-evaluation, calculates parameter score deltas, and provides side-by-side comparative benchmarking for 2 to 4 owned startup concepts.", "Objective 9 (Immutable Versioning & Comparative Matrix): ")
    add_bullet(doc, "Verify the correctness, multi-tenant isolation, rate limiting, and mathematical reliability of the platform through an automated test suite achieving 100% pass rate across at least 80 test cases, alongside empirical demonstration of a >40-point benchmark separation between viable and vague ideas.", "Objective 10 (Empirical Testing & Benchmark Discrimination): ")

    # 3.2 Proposed System Workflow and System Flow Diagram
    add_section(doc, "3.2 Proposed System Workflow and System Flow Diagram")
    add_p(doc, "The execution lifecycle of CheckStart AI operates as an integrated feedback loop spanning founder onboarding, conversational attribute extraction, asynchronous or synchronous pipeline processing, and interactive report exploration.")
    
    add_figure_placeholder(doc, "3.2", "The 15-Layer Sequential Validation Pipeline Architecture", 
        "Sequential data flow illustrating the end-to-end execution path from raw idea input, structural parsing, MiniLM vector embedding, cosine similarity matching, rule checking, Gemini Pro inference, Layer 8 score overrides, 9-dimension scoring, confidence calibration, to Lean Startup recommendation generation.")
    
    add_p(doc, "The end-to-end workflow comprises nineteen (19) distinct procedural steps:")
    add_bullet(doc, "The founder enters natural language pitch statements or clicks 'New Validation' from the dashboard.", "Step 1 (Idea Submission): ")
    add_bullet(doc, "The API gateway verifies JWT credentials and evaluates word count bounds (10 to 3,000 words).", "Step 2 (Gateway Validation): ")
    add_bullet(doc, "The ChatService checks the unique client_message_id to prevent duplicate processing on network retries.", "Step 3 (Idempotency Check): ")
    add_bullet(doc, "Lexical regex scanners scan for adversarial prompt injection cues, routing hostile text to a quarantine handler.", "Step 4 (Adversarial Screening): ")
    add_bullet(doc, "The IdeaProfileExtractor parses problem, solution, customer, industry, and monetization cues, computing data completeness (0-100%).", "Step 5 (Profile Extraction): ")
    add_bullet(doc, "If essential fields are missing, the Socratic co-pilot generates 1-2 clarifying questions without triggering full scoring.", "Step 6 (Socratic Dialogue): ")
    add_bullet(doc, "Upon founder command ('Validate idea'), the validation request is dispatched synchronously or queued as an asynchronous Celery task.", "Step 7 (Pipeline Invocation): ")
    add_bullet(doc, "The NLPService filters English stopwords and extracts the top 10 domain keywords and linguistic problem/solution cues.", "Step 8 (NLP Processing): ")
    add_bullet(doc, "The EmbeddingService checks the SHA-256 hash in Redis; on cache miss, all-MiniLM-L6-v2 computes a 384-dimensional dense vector.", "Step 9 (Dense Embedding Generation): ")
    add_bullet(doc, "The SimilarityService calculates cosine similarity against stored database vectors, flagging competitor overlap (>=0.85).", "Step 10 (Similarity Analysis): ")
    add_bullet(doc, "The RuleService evaluates deterministic constraints and input length sufficiency.", "Step 11 (Rule Engine Evaluation): ")
    add_bullet(doc, "The EvidenceService classifies benchmark citations into Verified, Estimated, Generated, or Unknown provenance.", "Step 12 (Evidence Classification): ")
    add_bullet(doc, "Prompt Version v1.3 is dispatched to Google Gemini Pro (or MockProvider on network/key failure) requesting structured JSON reasoning.", "Step 13 (LLM Qualitative Inference): ")
    add_bullet(doc, "The VerificationService inspects raw LLM scores and enforces hard caps if monetization, target customer, or reality checks fail.", "Step 14 (Post-LLM Score Verification): ")
    add_bullet(doc, "The ScoringService applies authoritative 9-dimension normalized weights, rolls up to 7 visual parameters, and assigns a 5-tier classification.", "Step 15 (Authoritative Viability Scoring): ")
    add_bullet(doc, "The ConfidenceService calculates statistical confidence (0-100%) and applies penalty deductions.", "Step 16 (Confidence Calibration): ")
    add_bullet(doc, "The RecommendationEngine diagnoses root causes, formulates Lean Startup experiments, ranks top-3 actions, and predicts score gains.", "Step 17 (Strategic Recommendation): ")
    add_bullet(doc, "The master record (ValidationResult version N+1), scores (9 rows), evidence, competitors, and millisecond timings are committed in an ACID transaction.", "Step 18 (Relational Persistence): ")
    add_bullet(doc, "The React SPA renders the interactive report console, dynamic SVG ScoreGauge, 7-parameter radar polygons, and PDF export.", "Step 19 (Interactive Presentation): ")

    # 3.3 Selection of Components, Tools, and Techniques
    add_section(doc, "3.3 Selection of Components, Tools, and Techniques")
    add_p(doc, "Every software package, machine learning framework, database engine, and frontend library in CheckStart AI was selected based on strict requirements for type safety, execution performance, operational resilience, and reproducible verification. Table 3.1 enumerates the verified technology inventory.")

    tech_headers = ["Layer / Domain", "Technology & Framework", "Verified Version", "Architectural Role & Justification"]
    tech_data = [
        ["Presentation Framework", "React", "18.3.1", "Declarative component-based UI rendering with virtual DOM diffing."],
        ["Frontend Typing", "TypeScript", "5.6.2", "Strict static type checking across API response envelopes and UI props."],
        ["Build Toolchain", "Vite", "5.4.6", "Lightning-fast Hot Module Replacement (HMR) and Rollup production bundling."],
        ["Styling Framework", "Tailwind CSS", "3.4.11", "Utility-first responsive CSS styling with persistent dark/light theme mode."],
        ["Data Visualization", "Recharts", "2.12.7", "Declarative SVG charting for 7-parameter radar polygons and score histories."],
        ["Client PDF Export", "jsPDF & html2canvas", "2.5.2 / 1.4.1", "Direct in-browser rasterization and vector PDF report generation."],
        ["Backend REST Engine", "FastAPI", "0.109.0", "Asynchronous Python ASGI web framework with automatic OpenAPI documentation."],
        ["ASGI Web Server", "Uvicorn (Standard)", "0.27.0", "Production-grade asynchronous web server based on uvloop and httptools."],
        ["Data Modeling", "Pydantic & Settings", "2.6.0 / 2.1.0", "Runtime schema validation, data coercion, and type-safe environment loading."],
        ["Object Relational Mapper", "SQLAlchemy", "2.0.25", "Enterprise decoupled relational ORM with transactional connection pooling."],
        ["Database Migrations", "Alembic", "1.13.1", "Reproducible, versioned database schema migrations across environments."],
        ["Relational Storage", "SQLite 3 / PostgreSQL", "Built-in / 16.0", "Zero-config SQLite for testing; enterprise PostgreSQL for production."],
        ["Dense Vector Model", "SentenceTransformers", "2.3.1 (MiniLM)", "Generates 384-dimensional dense semantic embeddings (all-MiniLM-L6-v2)."],
        ["Mathematical ML", "Scikit-learn", "1.4.0", "Fast cosine similarity matrix computation and vector distance operations."],
        ["Generative AI SDK", "google-generativeai", "0.3.2", "Official Google Gemini Pro SDK for multi-parameter venture reasoning."],
        ["Heuristic Fallback", "MockProvider Engine", "Internal v2.0", "Deterministic profile-aware fallback engine for offline testing and zero-cost dev."],
        ["In-Memory Cache", "Redis (redis-py)", "5.0.1", "Sub-millisecond SHA-256 embedding caching and Celery message broker."],
        ["Asynchronous Queue", "Celery", "5.3.6", "Distributed background task queue for offloading heavy 15-layer validations."],
        ["Security & Tokens", "PyJWT & Passlib", "3.3.0 / 1.7.4", "HMAC-SHA256 JWT access tokens and adaptive salted bcrypt password hashing."],
        ["API Rate Limiting", "SlowAPI", "0.1.9", "Leaky-bucket IP-based rate limiting protecting auth and validation routes."],
        ["Structured Logging", "Structlog", "24.1.0", "Machine-readable contextual JSON logging for audit trails and layer telemetry."],
        ["Automated Testing", "Pytest & AnyIO", "9.1.1 / 4.9.0", "Asynchronous automated test execution runner covering 85 test cases."],
    ]
    create_styled_table(doc, tech_headers, tech_data, col_widths=[1.5, 1.8, 1.2, 2.2], table_num="3.1", caption="Verified Technology Stack and Tool Specifications")

    # 3.4 Overall Multi-Tier System Architecture
    add_section(doc, "3.4 Overall Multi-Tier System Architecture")
    add_p(doc, "CheckStart AI is organized into five decoupled tiers: Presentation Tier, API Gateway & Security Tier, Application Service Tier, Pipeline Validation Engine, and Persistence & Caching Tier.")
    
    add_figure_placeholder(doc, "3.1", "Overall Multi-Tier System Architecture Diagram", 
        "Architectural block diagram showing client SPA views communicating via HTTPS REST with the FastAPI gateway, passing through rate limiters and auth dependencies to service repositories, Celery background workers, SentenceTransformer embeddings, and the 15-layer validation pipeline.")
    
    add_subsection(doc, "3.4.1 Presentation Tier (Client SPA)")
    add_p(doc, "The presentation tier is implemented as a single-page application (SPA) in React 18 and TypeScript. Application state is partitioned cleanly between global context providers (AuthContext for user credentials and token lifecycle; ThemeContext for persistent dark/light theme switching) and local component hooks. The client communicates with the backend exclusively via an Axios-based REST client (api.ts) configured with request/response interceptors that automatically attach Bearer JWT tokens, unwrap standardized envelope schemas, and redirect to /login upon encountering HTTP 401 unauthorized errors.")

    add_subsection(doc, "3.4.2 API Gateway & Security Tier")
    add_p(doc, "The API gateway is hosted on FastAPI, mounting routes under both the canonical /api/v1 specification and the /api frontend reverse-proxy prefix. The gateway enforces three critical cross-cutting security concerns:")
    add_bullet(doc, "SlowAPI intercepts requests before route controllers execute. Sensitive authentication endpoints are restricted to 5 requests per minute, conversation messaging to 30 requests per minute, and pipeline validation to 15 requests per minute per IP/user.", "1. Rate Limiting Middleware: ")
    add_bullet(doc, "FastAPI dependency injection (get_current_user) decodes the HMAC-SHA256 JWT token from the Authorization header, verifies signature and expiration, retrieves the user from the database, and injects the authenticated User model. Administrative routes enforce require_admin (role == 'ADMIN').", "2. Authentication & RBAC Guard: ")
    add_bullet(doc, "Global exception handlers catch Pydantic RequestValidationError (HTTP 422), HTTPException (400, 401, 403, 404), and RateLimitExceeded (HTTP 429), transforming raw Python exceptions into standardized ErrorResponse JSON envelopes.", "3. Structured Error Normalization: ")

    add_subsection(doc, "3.4.3 Application Service Tier")
    add_p(doc, "The business logic tier strictly implements the Service-Repository design pattern. Routers in app/api/ contain zero raw database queries or complex arithmetic; they merely validate incoming Pydantic schemas, call the appropriate service in app/services/, and return Pydantic response models. Services encapsulate core algorithms: ChatService manages Socratic session state, IdeaService coordinates CRUD and version increments, EmbeddingService manages vector generation, and ComparisonService synthesizes multi-idea trade-offs.")

    add_subsection(doc, "3.4.4 Persistence, Caching & Task Tier")
    add_p(doc, "Data persistence is managed by SQLAlchemy 2.0. In local development and testing, SQLite 3 provides zero-configuration ACID storage. In production, Docker Compose orchestrates PostgreSQL 16 (for relational tables) and Redis 7 (serving as both an SHA-256 embedding cache and a Celery message broker). Long-running validation runs can execute asynchronously via tasks.py:run_validation_pipeline_task, while interactive validation can execute synchronously in under 5 seconds.")

    # 3.5 Detailed 15-Layer Sequential Validation Pipeline
    add_section(doc, "3.5 Detailed 15-Layer Sequential Validation Pipeline")
    add_p(doc, "The foundational intellectual contribution of the backend is the 15-layer sequential pipeline implemented in validation_service.py:42-390. Every layer is timed independently in milliseconds and logged to pipeline_timing. The 15 layers are detailed below:")
    
    layers_data = [
        ["1", "Structural Profile Extractor", "IdeaProfileExtractor (idea_profile_service.py)", "Raw idea submission dictionary", "Structural IdeaProfile, completeness score, is_vague flag", "Extracts problem, solution, customer, industry, business model; flags vagueness if customer is 'everyone'."],
        ["2", "NLP Attribute & Cue Extractor", "NLPService (nlp_service.py)", "Raw title and description text", "Top 10 domain keywords, problem cues, solution cues", "Strips English stopwords, calculates term frequencies, applies regex heuristics for pain-point cues."],
        ["3", "Dense Vector Embedder", "EmbeddingService (embedding_service.py)", "Concatenated '{title} {description}'", "384-dimensional dense float vector, SHA-256 text hash", "Checks Redis cache; on miss, executes SentenceTransformer('all-MiniLM-L6-v2') on local CPU."],
        ["4", "Semantic Similarity Matcher", "SimilarityService (similarity_service.py)", "Target vector, peer embeddings in database", "Cosine similarity coefficient, competitor overlap classification", "Calculates cosine distance against stored vectors; tags HIGH_OVERLAP (>=0.85) and shared keywords."],
        ["5", "Deterministic Rule Engine", "RuleService (rule_service.py)", "Submission text and attribute dictionary", "Rule compliance report, injection quarantine flag", "Enforces word limits [10, 3000], field minimums (>=5 chars), and scans lexical regex injection cues."],
        ["6", "Evidence Retrieval & Tagging", "EvidenceService (evidence_service.py)", "Extracted industry and problem keywords", "Classified evidence citations with credibility tiers", "Tags citations into Verified (Gartner/Statista), Estimated (Web URLs), Generated (LLM), or Unknown."],
        ["7", "LLM Reasoning Inference", "LLMProvider (gemini_provider.py / mock_provider.py)", "Prompt Version v1.3 with structured idea context", "Raw 9-dimension qualitative scores and textual justifications", "Dispatches multi-parameter prompt to Google Gemini Pro; falls back to MockProvider heuristics on failure."],
        ["8", "Post-LLM Score Verification", "VerificationService (verification_service.py)", "Raw LLM scores, structured idea profile", "Verified score dictionary, score_overrides audit list", "Anti-sycophancy guardrail: caps missing revenue at 45.0, vague customer at 25.0, fraud products at <=15.0."],
        ["9", "Authoritative 9-Dim Scoring", "ScoringService (scoring_service.py)", "Verified 9-dimension scores", "Overall Score (0-100), 7 visual parameters, 5-band rubric", "Calculates weighted sum (sum(W_i * S_i) = 1.000); rolls up 9 backend scores to 7 visual parameters (1-10)."],
        ["10", "Calibrated Confidence Engine", "ConfidenceService (confidence_service.py)", "Completeness, evidence count, override count, provider", "Confidence Score (0-100%), breakdown dictionary", "Calculates multi-factor confidence and applies deterministic deductions for overrides, mock mode, and length."],
        ["11", "Information Gap Identification", "RecommendationEngine (recommendation_engine_service.py)", "Extracted profile and sub-scores", "List of critical missing commercial elements", "Identifies absence of customer acquisition cost (CAC), lifetime value (LTV), pricing elasticity, channels."],
        ["12", "Root Cause Defect Diagnosis", "RootCauseService (recommendation_engine_service.py)", "Weak sub-scores (<60.0) and justifications", "Detailed operational root cause diagnostics", "Maps weak scores to structural business defects (e.g. lack of IP moat, unproven deep-tech dependencies)."],
        ["13", "Actionable Strategy Generator", "ImprovementStrategyService (recommendation_engine_service.py)", "Diagnosed root causes and information gaps", "Actionable mitigation hypotheses and Lean experiments", "Formulates concrete MVP experiments (e.g. landing page pre-order test, 10 stakeholder discovery interviews)."],
        ["14", "Action Prioritization Matrix", "ActionPrioritizationService (recommendation_engine_service.py)", "List of generated mitigation actions", "Prioritized actions (CRITICAL, HIGH, MED), Top-3 Actions", "Evaluates severity vs effort matrix; filters and ranks the top-3 highest-leverage immediate action items."],
        ["15", "Improvement Impact Prediction", "ImprovementImpactService (recommendation_engine_service.py)", "Ranked recommendations and current scores", "Predicted score gain per action, cumulative potential gain", "Calculates expected score gain (+3.5 to +8.0 pts) upon completing actions, capped at realistic maximum."],
    ]
    create_styled_table(doc, ["L#", "Pipeline Layer Name", "Implementing Service & File", "Input Data", "Output Data Artifact", "Core Processing Logic"], layers_data, col_widths=[0.4, 1.4, 1.4, 1.1, 1.1, 1.8], table_num="3.2", caption="Fifteen-Layer Sequential Validation Pipeline Specification")

    # 3.6 Authoritative 9-Dimension Mathematical Scoring Model
    add_section(doc, "3.6 Authoritative 9-Dimension Mathematical Scoring Model")
    add_p(doc, "A paramount design requirement is that Large Language Models are strictly prohibited from directly outputting the final overall validation score. In CheckStart AI, overall scores are computed by a deterministic mathematical engine implemented in ScoringService (scoring_service.py:25-95).")
    
    add_callout(doc,
        "OVERALL VIABILITY SCORE FORMULATION:\n\n"
        "S_overall = sum_{i=1}^{8} (S_i * W_i) + [(100 - S_risk) * W_risk]\n\n"
        "Where:\n"
        "S_overall : Overall Venture Viability Score (Bounded within [0.0, 100.0])\n"
        "S_1 : Market Demand Score in [0, 100] (Weight W_1 = 0.25)\n"
        "S_2 : Problem-Solution Fit Score in [0, 100] (Weight W_2 = 0.20)\n"
        "S_3 : Target Customer Clarity Score in [0, 100] (Weight W_3 = 0.10)\n"
        "S_4 : Competition Environment Score in [0, 100] (Weight W_4 = 0.10)\n"
        "S_5 : Uniqueness and Innovation Score in [0, 100] (Weight W_5 = 0.10)\n"
        "S_6 : Technical Feasibility Score in [0, 100] (Weight W_6 = 0.10)\n"
        "S_7 : Business Potential Score in [0, 100] (Weight W_7 = 0.10)\n"
        "S_8 : Scalability Score in [0, 100] (Weight W_8 = 0.03)\n"
        "S_risk : Raw Risk Level Score in [0, 100] (Inverted Weight W_risk = 0.02)\n"
        "Constraint: sum_{i=1}^{8} W_i + W_risk == 1.000 (Exactly 100% Normalized Sum)",
        title="MATHEMATICAL FORMULATION: 9-DIMENSION WEIGHTED VIABILITY ENGINE"
    )

    weight_headers = ["Dimension Index", "Venture Dimension Name", "Internal Code Identifier", "Weight (W_i)", "Percentage", "Core Evaluation Focus Area"]
    weight_data = [
        ["1", "Market Demand", "market_demand", "0.25", "25.0%", "Problem urgency, addressable market size (TAM), customer willingness to pay."],
        ["2", "Problem-Solution Fit", "problem_solution_fit", "0.20", "20.0%", "Directness, efficacy, and elegance of proposed solution versus pain point."],
        ["3", "Target Customer Clarity", "target_customer_clarity", "0.10", "10.0%", "Buyer persona specificity, decision-maker clarity, accessibility of segment."],
        ["4", "Competition Environment", "competition", "0.10", "10.0%", "Market saturation, barriers to entry, defensible moats against incumbents."],
        ["5", "Uniqueness & Innovation", "uniqueness_innovation", "0.10", "10.0%", "Novelty of approach, defensible intellectual property, proprietary workflows."],
        ["6", "Technical Feasibility", "technical_feasibility", "0.10", "10.0%", "Engineering complexity, technical hurdles, architectural stack maturity."],
        ["7", "Business Potential", "business_potential", "0.10", "10.0%", "Unit economics, gross margin potential, pricing strategy, revenue model clarity."],
        ["8", "Scalability", "scalability", "0.03", "3.0%", "Friction-free user expansion, marginal cost of serving additional customers."],
        ["9", "Risk Level (Inverted)", "risk_level", "0.02", "2.0%", "Execution liabilities, regulatory frictions, critical third-party platform dependencies."],
        ["TOTAL", "Authoritative Weight Sum", "sum(W_i)", "1.000", "100.0%", "Verified normalized mathematical sum across all 9 dimensions."],
    ]
    create_styled_table(doc, weight_headers, weight_data, col_widths=[0.8, 1.6, 1.4, 0.8, 0.8, 2.0], table_num="3.3", caption="Authoritative 9-Dimension Scoring Weights Allocation")

    # 3.7 Seven-Parameter Visual Rollup and 5-Band Viability Rubric
    add_section(doc, "3.7 Seven-Parameter Visual Rollup and 5-Band Viability Rubric")
    add_p(doc, "While backend verification requires 9 distinct mathematical dimensions, displaying 9 raw numbers creates cognitive overload for first-time founders. To optimize user comprehension, ScoringService maps the 9 backend dimensions to 7 visual parameters normalized to a 1.0 to 10.0 scale for rendering on radar polygons and progress widgets:")
    
    add_callout(doc,
        "SEVEN-PARAMETER VISUAL ROLLUP EQUATIONS (1.0 to 10.0 SCALE):\n\n"
        "P_1 (Market Demand) = max(1.0, min(10.0, S_market_demand / 10.0))\n"
        "P_2 (Problem Severity) = max(1.0, min(10.0, S_problem_solution_fit / 10.0))\n"
        "P_3 (Competition) = max(1.0, min(10.0, S_competition / 10.0))\n"
        "P_4 (Target Customer) = max(1.0, min(10.0, S_target_customer_clarity / 10.0))\n"
        "P_5 (Innovation) = max(1.0, min(10.0, S_uniqueness_innovation / 10.0))\n"
        "P_6 (Feasibility) = max(1.0, min(10.0, S_technical_feasibility / 10.0))\n"
        "P_7 (Revenue Potential) = max(1.0, min(10.0, S_business_potential / 10.0))",
        title="VISUAL ROLLUP EQUATIONS"
    )

    add_p(doc, "The calculated overall score (0–100) is deterministically categorized into a 5-band unified viability rubric, documented in Table 3.4. It is emphasized that these classifications represent system-defined viability heuristics, not guaranteed commercial survival.")

    rubric_headers = ["Score Range", "Classification Tier", "Display Label", "Interpretation & Venture Advisory Guidance"]
    rubric_data = [
        ["90.0 – 100.0", "EXCEPTIONAL", "Highly Promising", "Venture exhibits verified problem urgency, distinct buyer persona, clear moats, and high business potential. Recommended for immediate seed acceleration."],
        ["75.0 – 89.9", "STRONG", "Promising", "Concept demonstrates solid viability and product-solution fit; requires minor refinements in pricing models or customer acquisition strategy."],
        ["60.0 – 74.9", "MODERATE", "Moderate Viability", "Feasible concept but faces severe incumbent competition or unvalidated distribution channels. Demands targeted MVP landing-page experimentation."],
        ["40.0 – 59.9", "WEAK", "Needs Improvement", "Significant structural deficiencies detected; target customer is poorly defined, monetization is vague, or unit economics are unviable. Major pivot required."],
        ["0.0 – 39.9", "VERY_WEAK", "High Risk", "Fatal commercial flaws, unvalidated problem, missing revenue model, or deceptive product claims detected. Venture is unviable in current form."],
    ]
    create_styled_table(doc, rubric_headers, rubric_data, col_widths=[1.2, 1.4, 1.4, 3.2], table_num="3.4", caption="Five-Tier Viability Classification Rubric")

    # 3.8 Dense Vector Semantic Similarity Model and Caching
    add_section(doc, "3.8 Dense Vector Semantic Similarity Model and Caching")
    add_p(doc, "To detect semantic overlap against existing ideas and discover potential competitor ventures without manual keyword tagging, CheckStart AI employs dense vector sentence embeddings. The text representation '{title} {description}' is transformed into a dense vector space using the SentenceTransformer architecture:")
    
    add_callout(doc,
        "SEMANTIC COSINE SIMILARITY FORMULATION:\n\n"
        "sim(u, v) = (u . v) / (||u||_2 * ||v||_2) = (sum_{j=1}^{d} u_j * v_j) / (sqrt{sum_{j=1}^{d} u_j^2} * sqrt{sum_{j=1}^{d} v_j^2})\n\n"
        "Where:\n"
        "u, v in R^{384} : 384-dimensional dense vectors generated by all-MiniLM-L6-v2\n"
        "sim(u, v) in [-1.0, 1.0] : Normalized cosine similarity coefficient\n"
        "d = 384 : Dimensionality of embedding space",
        title="VECTOR SIMILARITY MATHEMATICS"
    )

    add_p(doc, "The SimilarityService enforces three strict operational thresholds:")
    add_bullet(doc, "Cosine similarity >= 0.85: Classified as HIGH_OVERLAP. If the matching idea belongs to another user, flags an external competitor alert. If it belongs to the same user, flags a duplicate submission alert.", "1. High Overlap Threshold (>= 0.85): ")
    add_bullet(doc, "Cosine similarity between 0.72 and 0.849: Classified as MODERATE_OVERLAP, highlighting partial conceptual or market overlap.", "2. Moderate Overlap Threshold (0.72 – 0.849): ")
    add_bullet(doc, "Cosine similarity < 0.72: Classified as UNIQUE, indicating a structurally differentiated approach.", "3. Unique Concept Threshold (< 0.72): ")
    add_p(doc, "To eliminate redundant neural network compute, EmbeddingCacheService computes the SHA-256 hash of the input text: hash = hashlib.sha256(text.encode()).hexdigest(). Vectors are cached in Redis with a 7-day TTL. On cache hit, vector retrieval completes in ~2 ms (compared to ~48 ms for fresh CPU inference). If Redis is unavailable, the service automatically falls back to an in-process Python dictionary cache.")

    # 3.9 Deterministic Verification and Anti-Sycophancy Override Rules
    add_section(doc, "3.9 Deterministic Verification and Anti-Sycophancy Override Rules")
    add_p(doc, "Layer 8 (VerificationService) is the critical neuro-symbolic guardrail separating CheckStart AI from naive LLM wrappers. The service intercepts the raw qualitative scores produced by Layer 7 and evaluates four deterministic domain rules before weighted aggregation occurs:")

    rule_headers = ["Rule Identifier", "Target Dimension", "Triggering Condition in Idea Context", "Enforced Score Cap", "Architectural Rationale & Guardrail Purpose"]
    rule_data = [
        ["Rule 1: Missing Monetization", "business_potential", "Revenue model is unspecified, blank, or completely undefined.", "Cap at 45.0", "Prevents LLM from assigning high commercial viability to ventures with zero revenue strategy."],
        ["Rule 1b: Rejection of Revenue", "business_potential", "Founder explicitly states 'don't want revenue' or 'will not sell'.", "Cap at 10.0", "Enforces commercial reality that ventures actively refusing revenue have negligible business potential."],
        ["Rule 2: Vague Target Customer", "target_customer_clarity", "Customer is unspecified, or generically defined as 'everyone' / 'students'.", "Cap at 25.0", "Neutralizes flattery; customer segments must be specific (e.g. 'collegiate dining hall directors')."],
        ["Rule 3: Deceptive / Fraud Signals", "Core Dimensions", "Idea description mentions 'magic', 'invisible water', 'guaranteed crore'.", "Cap at <= 15.0", "Prevents fraudulent or physically impossible product concepts from receiving positive scores."],
        ["Rule 4: Anti-Marketing Stance", "market_demand & business", "Founder explicitly states 'will not market' or 'no distribution plan'.", "Cap at 20.0", "Prevents high demand scores for products where the founder refuses customer acquisition."],
    ]
    create_styled_table(doc, rule_headers, rule_data, col_widths=[1.4, 1.2, 1.8, 1.0, 1.8], table_num="3.5", caption="Deterministic Override Rules Implemented in Layer 8")

    add_p(doc, "Every applied override is appended to validation_results.score_overrides with an audit justification string, providing full transparency to founders on why their scores were modified.")

    # 3.10 Multi-Factor Calibrated Confidence Engine
    add_section(doc, "3.10 Multi-Factor Calibrated Confidence Engine")
    add_p(doc, "In accordance with neural calibration theory (Guo et al., 2017), validation scores are meaningless if the system cannot communicate its statistical uncertainty. Layer 10 implements a multi-factor confidence calibration engine:")
    
    add_callout(doc,
        "CALIBRATED CONFIDENCE EQUATIONS:\n\n"
        "C_base = (0.35 * C_comp) + (0.35 * C_agree) + (0.15 * C_evid) + (0.15 * C_rule)\n\n"
        "C_final = max(0.0, min(100.0, C_base - D_overrides - D_evidence - D_mock - D_length))\n\n"
        "Where:\n"
        "C_comp in [0, 100] : Structural input completeness score from Layer 1\n"
        "C_agree in [0, 100] : Model agreement coefficient between qualitative justification and scores\n"
        "C_evid in [0, 100] : Evidence quality score based on verified benchmark citations\n"
        "C_rule in [0, 100] : Rule consistency score from Layer 5\n"
        "D_overrides = 5.0 * count(Layer 8 Overrides) : Penalty for non-grounded raw LLM scores\n"
        "D_evidence = 15.0 if zero evidence found (or 12.0 if all evidence is synthetic)\n"
        "D_mock = 20.0 if running on local MockProvider fallback\n"
        "D_length = 15.0 if text < 150 chars (or 8.0 if < 300 chars)\n"
        "DEGRADATION CEILING: If running on MockProvider, C_final is strictly capped at <= 40.0%",
        title="CONFIDENCE CALIBRATION MATHEMATICS"
    )

    # 3.11 Relational Database Design and Persistence
    add_section(doc, "3.11 Relational Database Design and Persistence")
    add_p(doc, "The database architecture is designed for full relational integrity, auditability, and immutability. Managed via SQLAlchemy 2.0 with 7 Alembic revisions (backend/alembic/versions/), the schema encompasses fifteen (15) relational tables documented in Table 3.6.")

    db_headers = ["Table Name", "Primary Key", "Foreign Keys", "Key Relational Columns", "Purpose & Architectural Role"]
    db_data = [
        ["users", "id (Integer)", "None", "email (UK), password_hash, role, auth_provider, google_sub", "Stores user credentials, roles (USER, ADMIN), and auth provider."],
        ["user_profiles", "user_id (Integer)", "users.id", "college, course, graduation_year, updated_at", "Stores collegiate founder demographic metadata."],
        ["user_preferences", "user_id (Integer)", "users.id", "theme (light/dark), email_notifications", "Stores UI theme and notification preferences."],
        ["ideas", "id (Integer)", "users.id", "title, description, problem, solution, version, is_deleted", "Stores master startup concept pitches and active version counter."],
        ["validation_sessions", "id (UUID String)", "users.id, ideas.id", "status, completeness_score, extracted_data, is_deleted", "Maintains multi-turn conversational chat sessions."],
        ["conversation_messages", "id (Integer)", "validation_sessions.id", "role, content, client_message_id (UK), created_at", "Stores chat message turns with client idempotency key."],
        ["validation_results", "id (Integer)", "ideas.id, sessions.id", "version, overall_score, classification, confidence_score, is_pinned", "Master immutable record of a completed validation run."],
        ["validation_scores", "id (Integer)", "validation_results.id", "parameter_name, raw_score, verified_score, weight, justification", "Stores individual 9-dimension scores per validation run."],
        ["embeddings", "id (Integer)", "ideas.id", "text_hash, vector (JSON Array), dimensions, created_at", "Stores 384-dimensional dense sentence embeddings."],
        ["recommendations", "id (Integer)", "validation_results.id", "title, description, priority, category, potential_gain, status", "Stores actionable Lean Startup improvement recommendations."],
        ["competitors", "id (Integer)", "validation_results.id", "name, similarity_score, overlap_level, shared_keywords", "Stores detected competitor matches and shared terms."],
        ["evidence", "id (Integer)", "validation_results.id", "source_name, source_type, claim, url, credibility_score", "Stores benchmark evidence citations and provenance tiers."],
        ["audit_logs", "id (Integer)", "validation_results.id", "event_type, input_hash, score, created_at", "Immutable audit trail logging lifecycle milestones."],
        ["pipeline_jobs", "id (UUID String)", "ideas.id", "status (PENDING, RUNNING, COMPLETED, FAILED), error", "Tracks Celery background worker execution state."],
        ["user_feedback", "id (Integer)", "users.id, val_results.id", "rating (1-5), comments, created_at", "Stores founder qualitative feedback on validation reports."],
    ]
    create_styled_table(doc, db_headers, db_data, col_widths=[1.5, 1.2, 1.4, 1.5, 1.6], table_num="3.6", caption="Relational Database Schema and Table Footprint")

    add_figure_placeholder(doc, "3.4", "Complete Relational Database Entity-Relationship (ER) Model", 
        "Entity-Relationship diagram illustrating 15 tables with 1:1, 1:N, and foreign key cardinality connecting users, ideas, validation sessions, immutable results, 9-dimension scores, embeddings, and audit logs.")

    # 3.12 REST API Design and Interface Contracts
    add_section(doc, "3.12 REST API Design and Interface Contracts")
    add_p(doc, "The API surface comprises 37 REST endpoints mounted across 11 functional routers in app/api/, mounted under both /api/v1 (canonical OpenAPI) and /api (frontend reverse proxy). All responses adhere to standardized JSON envelopes:")
    
    add_callout(doc,
        "STANDARDIZED API ENVELOPE CONTRACTS (app/schemas/envelope.py):\n\n"
        "Success Response Envelope (HTTP 200 / 201):\n"
        "{\n"
        "  \"success\": true,\n"
        "  \"data\": { ...payload... },\n"
        "  \"meta\": { \"timestamp\": \"2026-10-22T09:30:00Z\", \"requestId\": \"uuid\" }\n"
        "}\n\n"
        "Error Response Envelope (HTTP 400, 401, 403, 404, 422, 429, 500):\n"
        "{\n"
        "  \"success\": false,\n"
        "  \"error\": \"rate_limit_exceeded | validation_error | unauthorized\",\n"
        "  \"message\": \"Human-readable description\",\n"
        "  \"details\": { \"field\": \"Specific violation description\" }\n"
        "}",
        title="API ENVELOPE SPECIFICATION"
    )

    # 3.13 Automated Testing and Verification Strategy
    add_section(doc, "3.13 Automated Testing and Verification Strategy")
    add_p(doc, "To verify software correctness without human bias, CheckStart AI employs an automated test suite executed via Pytest 9.1.1. The test suite is organized into 15 test modules in backend/app/tests/:")
    add_bullet(doc, "Verifies soft-deletion (is_deleted=True), hard-delete administrative restrictions, ownership boundaries, async task states, embedding cache hits/misses, rate-limit error shapes, and prompt injection neutralization.", "1. Architectural & Security Tests (test_architectural_tasks.py): ")
    add_bullet(doc, "Verifies user registration, duplicate email rejection, bcrypt login checks, and Google GIS SSO user provisioning.", "2. Authentication Tests (test_auth.py): ")
    add_bullet(doc, "Evaluates discrimination between vague, detailed, and fraudulent concepts, ensuring detailed ventures strictly outscore vague ideas by >=25 points.", "3. Benchmark Discrimination Tests (test_benchmark.py): ")
    add_bullet(doc, "Verifies Socratic chat creation, entity extraction, completeness quantification, client idempotency keys, and re-validation version increments.", "4. Conversational Chat Tests (test_chat_service.py): ")
    add_bullet(doc, "Verifies 2-to-4 idea comparison constraints, validated-status requirements, and dashboard summary statistics.", "5. Comparison & Dashboard Tests (test_comparison_and_dashboard.py): ")
    add_bullet(doc, "Verifies mathematical bounds [0, 100] and penalty deductions.", "6. Confidence Calibration Tests (test_confidence.py): ")
    add_bullet(doc, "Verifies that the 9 backend weights sum to exactly 1.000, checks numerical score clamping, and validates 5-band rubric assignments.", "7. Scoring Tests (test_scoring.py): ")
    add_bullet(doc, "Verifies identical vector similarity (=1.00), orthogonal similarity (=0.00), overlap threshold flags, and multi-tenant isolation.", "8. Similarity Tests (test_similarity.py): ")
    add_bullet(doc, "Verifies root cause diagnosis, missing pricing recommendations, prioritization ranking, and LLM JSON repair parsing.", "9. Recommendation Engine Tests (test_recommendation_pipeline.py): ")
    add_bullet(doc, "Traverses all 15 layers in sequence, verifying immutable row generation and version delta calculations.", "10. Full Lifecycle Integration Tests (test_integration.py): ")

    # 3.14 Security Controls, Reliability, and Observability
    add_section(doc, "3.14 Security Controls, Reliability, and Observability")
    add_p(doc, "CheckStart AI implements enterprise security and reliability controls across all layers:")
    add_bullet(doc, "Passlib salted bcrypt password hashing resistant to GPU rainbow tables; HMAC-SHA256 JWT tokens with 1440-minute expiration.", "Identity Security: ")
    add_bullet(doc, "SlowAPI leaky-bucket rate limiting restricts brute-force attempts on sensitive routes.", "Rate Limiting: ")
    add_bullet(doc, "All database queries enforce user_id filtering, preventing User B from viewing or modifying User A's ideas.", "Multi-Tenant Isolation: ")
    add_bullet(doc, "Automatic graceful degradation from Gemini Pro to MockProvider on network/key failure; Redis fallback to in-memory dictionary; JSON repair parser extracts embedded markdown blocks.", "Fault Tolerance: ")
    add_bullet(doc, "Structlog outputs machine-readable contextual JSON logs; every layer records exact millisecond durations in pipeline_timing.", "Observability: ")

    # 3.15 Methodological Limitations and Ethical Safeguards
    add_section(doc, "3.15 Methodological Limitations and Ethical Safeguards")
    add_p(doc, "To uphold strict academic integrity, the following implementation limitations are explicitly acknowledged:")
    add_bullet(doc, "The RAGService (rag_service.py:1-13) is an abstract stub class with enabled = False returning empty lists []. Live querying against live USPTO patent databases or live SEC filings is currently disabled.", "1. Live Knowledge Retrieval Disabled: ")
    add_bullet(doc, "In backend/app/api/auth.py:176, Google GIS token claims are decoded using jwt.get_unverified_claims rather than verifying cryptographic signatures against Google's public JWKS certificates. This must be hardened before public production rollout.", "2. Google OAuth Signature Verification Hardening: ")
    add_bullet(doc, "Validation scores are decision-support heuristics based on structural completeness and market indicators. They do not constitute proof of future commercial survival or financial investment advice.", "3. Non-Guarantee of Commercial Survival: ")

    # 3.16 Chapter Summary
    add_section(doc, "3.16 Chapter Summary")
    add_p(doc, "This chapter presented the comprehensive methodology, system workflow, multi-tier architecture, the 15-layer sequential pipeline, authoritative 9-dimension scoring mathematics, semantic similarity models, deterministic verification guardrails, database schemas, and testing strategies. Chapter 4 provides a granular, module-by-module implementation analysis of all eleven functional software modules.")
    print("Chapter 3 built successfully.")
