# 01. Project Overview: CheckStart AI (AI Startup Validator)

## Executive Summary & Purpose
**CheckStart AI** (internally identified as `ai-startup-validator-frontend` and `AI Startup Idea Validation API`) is an AI-assisted startup validation and venture decision-support intelligence platform. The system is designed to help student and collegiate founders, early-stage entrepreneurs, incubators, and university entrepreneurship cells evaluate new business concepts before investing capital or engineering effort.

The platform provides a conversational AI mentor that extracts structured venture attributes from natural dialogue, a deterministic 15-layer validation pipeline, multi-dimensional scoring (9 backend dimensions mapped to 7 visual founder parameters), competitive similarity analysis with vector embeddings, root cause analysis, prioritized recommendations, and multi-idea comparative synthesis.

---

## Problem Statement & Target Users

### The Problem
- **High Early-Stage Failure Rate**: Over 90% of early-stage startups fail, predominantly due to building products with no market need, unclear customer definitions, flawed unit economics, or unexamined incumbent moats.
- **Flawed AI Feedback**: Generic LLM chats (e.g., standard ChatGPT prompts) suffer from sycophancy (flattering founders and declaring all ideas "brilliant"), hallucinated statistics, and lack of deterministic verification guardrails.
- **Founder Cognitive Bias**: Founders frequently overlook operational hurdles, competitor distribution moats, or legal/regulatory frictions.

### Target Personas
1. **Collegiate / Student Founders**: Students participating in campus incubators, hackathons, or pitch competitions needing rigorous, step-by-step guidance.
2. **First-Time Entrepreneurs**: Founders needing structured evaluation of problem severity, target customer clarity, and monetization models.
3. **Incubator Directors & Faculty Mentors**: Administrators requiring governance visibility, cross-cohort performance analytics, and objective evaluation benchmarks.

---

## Core Features & Capabilities

| Feature Domain | Capability Description | Technical Implementation |
| :--- | :--- | :--- |
| **Conversational Validation Assistant** | Interactive AI chatbot mentor that conducts Socratic questioning, extracts venture attributes, tracks completeness, and triggers evaluation upon request. | `ChatService` (`backend/app/services/chat_service.py`), `ValidationSession` & `ConversationMessage` models. |
| **15-Layer Evaluation Pipeline** | Comprehensive multi-layer evaluation pipeline combining NLP, embeddings, similarity matching, deterministic rules, LLM analysis, score verification, and impact prediction. | `ValidationService` (`backend/app/services/validation_service.py:42-390`). |
| **Deterministic Rule Engine** | Enforces hard constraints on input quality, word count, minimum problem definitions, similarity warnings, and prompt injection detection. | `RuleService` (`backend/app/services/rule_service.py:5-125`). |
| **Vector Similarity & Competitor Retrieval** | Detects semantic overlap against existing venture concepts using vector embeddings and cosine similarity. | `EmbeddingService` (`all-MiniLM-L6-v2`, 384 dimensions) & `SimilarityService` (`backend/app/services/similarity_service.py`). |
| **Verification & Score Overrides** | Layer 8 deterministic guardrail that overrides raw LLM scores if fundamental data (revenue model, target customer) is absent or anti-patterns are detected. | `VerificationService` (`backend/app/services/verification_service.py:31-346`). |
| **Calibrated Confidence Engine** | Computes confidence score (0-100%) based on input completeness, model agreement, evidence quality, and rule consistency, applying penalties for overrides and mock mode. | `ConfidenceService` (`backend/app/services/confidence_service.py:37-159`). |
| **Root Cause & Action Prioritization** | Analyzes sub-score weaknesses, generates mitigation strategies, prioritizes top-3 actions, and predicts score improvement. | `RecommendationEngineService` (`backend/app/services/recommendation_engine_service.py:17-138`). |
| **Multi-Idea Comparative Matrix** | Compares 2 to 4 validated startup ideas side-by-side across all 7 parameters with radar charts and AI synthesis. | `comparisons.py` (`backend/app/api/comparisons.py:88-215`). |
| **Founder Dashboard** | Visual dashboard displaying validation score trends, classification distribution, recent evaluations, and idea portfolios. | `dashboard.py` (`backend/app/api/dashboard.py:18-172`), `DashboardPage.tsx`. |
| **PDF & Markdown Report Export** | Generates formatted PDF reports via client-side rendering (`html2canvas` + `jspdf`) and clean server-side Markdown exports. | `pdfExport.ts`, `reports.py:189-209`. |
| **Admin Observability & Governance** | System-wide observability dashboard displaying user growth, validation volume, pipeline execution latency, LLM fallback rate, and score distributions. | `admin.py` (`backend/app/api/admin.py:21-384`), `AdminDashboardPage.tsx`. |

---

## End-to-End User Workflows

### 1. Founder Registration & Profile Onboarding
```
[Landing Page / Register] 
    → Local Registration (Name, Email, Password, College, Course, Grad Year) OR Google GIS OAuth
    → Token Generation (JWT 60m expiry) 
    → Session initialized in AuthContext & persisted to localStorage
    → Redirect to /dashboard
```

### 2. Conversational Idea Inception & Attribute Extraction
```
[New Validation Page (/validate)]
    → Session created via POST /sessions
    → Founder chats with CheckStart AI mentor
    → NLP & regex extract problem, solution, customer, industry, revenue model
    → Completeness score updates (0% → 100%)
    → Idea record synchronized in DB
    → Founder clicks "Validate Idea" or types "Validate now"
```

### 3. Asynchronous & Synchronous Pipeline Execution
```
[Trigger Validation]
    → POST /sessions/{id}/validate OR POST /ideas/{id}/validate
    → Asynchronous: Celery worker tasks.py:run_validation_pipeline_task queued via Redis
    → Synchronous fallback: ValidationService.run_validation_pipeline executes 15 layers
    → Results persisted: ValidationResult, ValidationScore (9 rows), Evidence, Competitor, Recommendation, AuditLog
    → Redirect to /report/{report_id}
```

### 4. Interactive Report Exploration & Iterative Improvement
```
[Report Result Page (/report/:id)]
    → Displays Score Gauge, 4-tier Category Badge, 7-Parameter Radar & Progress Bars
    → Strengths, Weaknesses, Risk Matrix, Market Analysis, and Prioritized Recommendations
    → Founder acts on recommendations and chats further in conversation
    → Re-validation triggers new immutable version (v1 → v2)
    → Delta comparison highlights parameter changes and resolved recommendations
```

### 5. Multi-Idea Comparison Workflow
```
[Compare Ideas Page (/compare)]
    → Select 2 to 4 validated ideas from portfolio
    → POST /ideas/compare validates eligibility (distinct ideas, validated on framework v1.0)
    → Side-by-side radar overlay + comparative synthesis generated via Gemini / Heuristics
```

### 6. Admin Governance & Platform Auditing
```
[Admin Portal (/admin/dashboard)]
    → Admin login via POST /auth/admin/login (requires role="ADMIN")
    → View pipeline latency, layer timings, score distribution, LLM fallback rate
    → Browse all users, ideas, and validation reports across the institution
```

---

## Functional & Non-Functional Requirements Matrix

### Functional Requirements
- **FR-01: Authentication & Authorization**: Secure local login/registration with bcrypt and Google GIS OAuth support. Role-Based Access Control (RBAC) separating `USER` and `ADMIN`.
- **FR-02: Conversational Data Capture**: Streaming and standard message exchange with automatic entity recognition and completeness quantification.
- **FR-03: Multi-Layer Validation**: 15 distinct evaluation layers executing sequentially with execution timing recorded per layer.
- **FR-04: Deterministic Guardrails**: Overriding non-grounded LLM outputs when critical business elements are missing.
- **FR-05: Immutable Versioning**: Every validation execution creates a permanent, versioned historical record `(idea_id, version)`.
- **FR-06: Idea Comparison**: Strict 2 to 4 idea multi-axis comparison.
- **FR-07: Telemetry & Auditability**: Every completed validation logs input hashes and timings in `audit_logs` and structured logs.

### Non-Functional Requirements
- **NFR-01: Performance**: Individual pipeline layer executions logged in milliseconds; total pipeline duration under 10 seconds under mock mode, under 15 seconds with external LLM.
- **NFR-02: Security**: Passwords hashed with bcrypt; access tokens signed with HMAC-SHA256; prompt injection keywords detected and quarantined; rate limiting enforced on sensitive endpoints.
- **NFR-03: Reliability & Degradation**: Automatic graceful degradation from Gemini LLM to heuristic mock provider if external API key is absent, expired, or rate-limited.
- **NFR-04: Maintainability & Modularity**: Separation of concerns across repositories, services, controllers (routers), and Pydantic schemas.

---

## Current Implementation Status

| Feature / Module | Status | Verification Evidence | Notes |
| :--- | :--- | :--- | :--- |
| **Local Authentication** | Fully Implemented | `backend/app/api/auth.py:57-164` | Bcrypt hashing, JWT generation, rate limiting. |
| **Google GIS OAuth** | Fully Implemented | `backend/app/api/auth.py:165-252` | Accepts Google token, auto-provisions user. |
| **Admin Authentication & RBAC** | Fully Implemented | `backend/app/api/auth.py:253-291`, `dependencies.py:36-44` | Enforces `role == "ADMIN"`. |
| **Conversational Validation Assistant** | Fully Implemented | `backend/app/services/chat_service.py` | Socratic questioning, attribute extraction, completeness score. |
| **15-Layer Validation Pipeline** | Fully Implemented | `backend/app/services/validation_service.py:42-390` | All 15 layers timed and logged. |
| **Deterministic Verification Layer** | Fully Implemented | `backend/app/services/verification_service.py` | Overrides raw LLM scores for missing customer/revenue. |
| **9-to-7 Parameter Scoring Engine** | Fully Implemented | `backend/app/services/scoring_service.py` | 9 backend weights summing to 1.0; 7 frontend rollups. |
| **Embedding & Similarity Engine** | Fully Implemented | `backend/app/services/embedding_service.py`, `similarity_service.py` | SentenceTransformer + in-memory cosine fallback. |
| **Embedding Cache** | Fully Implemented | `backend/app/services/embedding_cache_service.py` | Redis cache with in-memory dict fallback. |
| **Multi-Idea Comparison** | Fully Implemented | `backend/app/api/comparisons.py` | Compares 2-4 ideas; Gemini synthesis with heuristic fallback. |
| **Dashboard Metrics & History** | Fully Implemented | `backend/app/api/dashboard.py` | Real database aggregations for founder metrics. |
| **Admin Observability & Management** | Fully Implemented | `backend/app/api/admin.py` | Platform metrics, user details, idea governance. |
| **Celery Background Pipeline** | Partially Implemented | `backend/app/services/tasks.py` | Code complete, works with Redis; falls back to synchronous execution in simple dev mode. |
| **Outgoing Webhooks** | Partially Implemented | `backend/app/services/tasks.py:49-90` | Webhook dispatch implemented with 3x retry; requires Celery task runner. |
| **RAG Knowledge Retrieval** | Mocked / Placeholder | `backend/app/services/rag_service.py:1-13` | Stub class returning empty list `[]` (`enabled: bool = False`). |
| **Google ID Token Signature Verification** | Needs Hardening | `backend/app/api/auth.py:176` | Uses `jwt.get_unverified_claims` rather than Google Public Key verification. |
