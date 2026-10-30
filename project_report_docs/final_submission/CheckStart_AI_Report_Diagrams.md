# CheckStart AI: Academic Report Diagrams Source (Mermaid)

This document contains the complete, editable Mermaid diagram sources for all architectural, procedural, and relational figures included in the academic project report for **CheckStart AI: AI-Assisted Startup Idea Validation and Strategic Recommendation Platform**.

---

## Figure 3.1: Overall System Architecture (Multi-Tier)

```mermaid
flowchart TD
    subgraph PRESENTATION_TIER ["1. Presentation Tier (React 18.3 + TypeScript + Vite SPA)"]
        UI_AUTH["Authentication Views (LoginPage, RegisterPage)"]
        UI_DASH["Founder Dashboard (DashboardPage)"]
        UI_CHAT["Socratic Conversational Co-Pilot (NewValidationPage)"]
        UI_REPORT["Interactive Report Console (ReportResultPage)"]
        UI_COMPARE["Multi-Idea Comparison Matrix (CompareIdeasPage)"]
        UI_ADMIN["Institutional Governance Portal (AdminDashboardPage)"]
        UI_STATE["State Management (AuthContext, ThemeContext, LocalStorage)"]
    end

    subgraph API_GATEWAY ["2. Gateway & Security Tier (FastAPI ASGI)"]
        PROXY["Reverse Proxy Routing (/api and /api/v1)"]
        LIMITER["SlowAPI Rate Limiter (Leaky Bucket)"]
        AUTH_GUARD["JWT Security Guard (PyJWT HS256 + Bcrypt)"]
        ERROR_HANDLER["Structured Envelope Middleware (SuccessResponse / ErrorResponse)"]
    end

    subgraph APPLICATION_SERVICES ["3. Business Logic & Service Tier (Python 3.10 / 3.13)"]
        AUTH_SVC["Auth & Profile Service (auth.py, users.py)"]
        CHAT_SVC["Conversational Socratic Assistant (chat_service.py)"]
        IDEA_SVC["Idea Repository & Versioning (ideas.py, history.py)"]
        COMPARE_SVC["Multi-Idea Benchmarking Service (comparisons.py)"]
        ADMIN_SVC["Platform Telemetry & Metrics Service (admin.py)"]
        ASYNC_TASKS["Celery Background Worker (tasks.py)"]
    end

    subgraph PIPELINE_ENGINE ["4. The 15-Layer Validation Pipeline Engine (validation_service.py)"]
        L1["L1: Structural Profile Extractor"]
        L2["L2: NLP Keyword & Cue Extractor"]
        L3["L3: SentenceTransformer 384-Dim Embedder"]
        L4["L4: Cosine Semantic Similarity Matcher"]
        L5["L5: Deterministic Rule Engine & Quarantine"]
        L6["L6: Benchmark Evidence Retrieval & Classifier"]
        L7["L7: LLM Qualitative Inference (Gemini / Mock)"]
        L8["L8: Post-LLM Verification & Score Overrides"]
        L9["L9: Authoritative 9-Dim Weighted Scoring"]
        L10["L10: Multi-Factor Calibrated Confidence Engine"]
        L11["L11: Information Gap Identification"]
        L12["L12: Root Cause Defect Diagnostic Engine"]
        L13["L13: Actionable Strategy Generator"]
        L14["L14: Action Prioritization Matrix (Critical/High/Med)"]
        L15["L15: Improvement Impact Gain Prediction"]
    end

    subgraph DATA_STORAGE ["5. Persistence & Caching Tier"]
        SQL_DB[("Relational Database (PostgreSQL 16 / SQLite 3)")]
        REDIS_CACHE[("In-Memory Cache & Celery Broker (Redis 7)")]
        CLOUD_AI["External AI Cloud (Google Gemini Pro API)"]
    end

    UI_AUTH --> PROXY
    UI_DASH --> PROXY
    UI_CHAT --> PROXY
    UI_REPORT --> PROXY
    UI_COMPARE --> PROXY
    UI_ADMIN --> PROXY

    PROXY --> LIMITER --> AUTH_GUARD --> ERROR_HANDLER
    ERROR_HANDLER --> AUTH_SVC
    ERROR_HANDLER --> CHAT_SVC
    ERROR_HANDLER --> IDEA_SVC
    ERROR_HANDLER --> COMPARE_SVC
    ERROR_HANDLER --> ADMIN_SVC

    CHAT_SVC --> PIPELINE_ENGINE
    IDEA_SVC --> PIPELINE_ENGINE
    IDEA_SVC -.-> ASYNC_TASKS -.-> PIPELINE_ENGINE

    L1 --> L2 --> L3 --> L4 --> L5 --> L6 --> L7 --> L8 --> L9 --> L10 --> L11 --> L12 --> L13 --> L14 --> L15

    L3 <--> REDIS_CACHE
    L7 <--> CLOUD_AI
    PIPELINE_ENGINE --> SQL_DB
    AUTH_SVC --> SQL_DB
    IDEA_SVC --> SQL_DB
```

---

## Figure 3.2: The 15-Layer Sequential Validation Pipeline

```mermaid
flowchart TD
    INPUT(["Raw Startup Idea Input"]) --> L1["Layer 1: Structural Profile Extractor<br/>(Parses fields, checks completeness, flags vagueness)"]
    L1 --> L2["Layer 2: NLP Attribute & Cue Extractor<br/>(Stopword stripping, 10 keywords, regex problem/solution cues)"]
    L2 --> L3["Layer 3: Dense Vector Embeddings<br/>(SentenceTransformer all-MiniLM-L6-v2, 384-dim, Redis cache)"]
    L3 --> L4["Layer 4: Semantic Similarity Matcher<br/>(Cosine similarity against peer ideas, competitor overlap detection)"]
    L4 --> L5["Layer 5: Deterministic Rule Engine<br/>(Length bounds [10, 3000 words], prompt injection quarantine)"]
    L5 --> L6["Layer 6: Benchmark Evidence Retrieval<br/>(Source provenance classification: Verified, Estimated, Generated)"]
    L6 --> L7["Layer 7: LLM Reasoning Inference<br/>(Prompt v1.3 with Google Gemini Pro or MockProvider fallback)"]
    L7 --> L8["Layer 8: Post-LLM Verification Guardrail<br/>(Anti-flattery score overrides: caps missing revenue/customer/fraud)"]
    L8 --> L9["Layer 9: Authoritative 9-Dim Scoring<br/>(Deterministic weighted sum = 1.000, 7-param visual rollup)"]
    L9 --> L10["Layer 10: Calibrated Confidence Engine<br/>(Base formula - override/evidence/mock/length deductions)"]
    L10 --> L11["Layer 11: Information Gap Scanner<br/>(Detects missing unit economics, pricing elasticity, CAC/LTV)"]
    L11 --> L12["Layer 12: Root Cause Defect Diagnosis<br/>(Deep diagnostic mapping from weak sub-scores to operational defects)"]
    L12 --> L13["Layer 13: Actionable Strategy Generator<br/>(Formulates concrete Lean Startup validation experiments)"]
    L13 --> L14["Layer 14: Action Prioritization Matrix<br/>(Categorizes into Critical, High, Med; extracts Top-3 Actions)"]
    L14 --> L15["Layer 15: Impact Gain Prediction<br/>(Predicts anticipated score delta upon completing recommendations)"]
    L15 --> OUTPUT(["Output: Immutable ValidationResult Persisted in DB"])
```

---

## Figure 3.3: Conversational Socratic Dialogue & Inception Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Founder as Student Founder
    participant Client as React SPA (NewValidationPage)
    participant API as FastAPI Router (/api/conversations)
    participant ChatService as ChatService (chat_service.py)
    participant Extractor as IdeaProfileExtractor
    participant Pipeline as 15-Layer Validation Pipeline
    participant DB as Relational Database

    Founder->>Client: Types startup concept ("CampusConnect - Peer tutoring app")
    Client->>API: POST /api/conversations/{id}/messages (client_message_id)
    API->>ChatService: process_message(session_id, content)
    ChatService->>ChatService: Verify Idempotency (prevent duplicate submissions)
    ChatService->>ChatService: Lexical Injection Scanner (Neutralize jailbreak attempts)
    ChatService->>Extractor: extract_attributes(content, prior_context)
    Extractor-->>ChatService: Extracted: {problem, solution, customer="students"}
    ChatService->>Extractor: calculate_completeness()
    Extractor-->>ChatService: Completeness: 45% (Flags: Missing Revenue Model)
    ChatService->>DB: Append message to conversation_messages
    ChatService->>ChatService: Formulate Socratic Clarification (Ask monetization & pricing)
    ChatService-->>API: Return { reply, completeness: 45, extracted_entities }
    API-->>Client: HTTP 200 OK
    Client-->>Founder: Displays Socratic guidance + 45% completeness gauge

    Founder->>Client: Clicks "Validate Idea" CTA
    Client->>API: POST /api/conversations/{id}/validate
    API->>Pipeline: run_validation_pipeline(idea_dict)
    Pipeline->>Pipeline: Execute Layers 1 through 15 sequentially
    Pipeline->>DB: Persist ValidationResult, 9 Scores, Recommendations
    Pipeline-->>API: Return Report ID & Overall Score
    API-->>Client: HTTP 200 OK { report_id: 104, overall_score: 76.4 }
    Client-->>Founder: Redirects to /report/104 (Interactive Console)
```

---

## Figure 3.4: Complete Database Entity-Relationship (ER) Model

```mermaid
erDiagram
    users ||--o{ ideas : "owns (1:N)"
    users ||--o| user_profiles : "profile (1:1)"
    users ||--o| user_preferences : "settings (1:1)"
    users ||--o{ validation_sessions : "creates (1:N)"
    users ||--o{ user_feedback : "submits (1:N)"

    ideas ||--o{ validation_results : "evaluated by (1:N)"
    ideas ||--o{ embeddings : "represented by (1:N)"
    ideas ||--o{ pipeline_jobs : "queued for (1:N)"

    validation_sessions ||--o{ conversation_messages : "contains (1:N)"
    validation_sessions ||--o{ validation_results : "triggers (1:N)"

    validation_results ||--o{ validation_scores : "contains 9 scores (1:N)"
    validation_results ||--o{ evidence : "supported by (1:N)"
    validation_results ||--o{ competitors : "identifies (1:N)"
    validation_results ||--o{ recommendations : "generates (1:N)"
    validation_results ||--o{ audit_logs : "audits (1:N)"

    users {
        int id PK
        string email UK
        string name
        string password_hash
        string role
        string auth_provider
        string google_sub UK
        datetime created_at
        datetime last_login_at
    }

    user_profiles {
        int user_id PK,FK
        string college
        string course
        int graduation_year
        datetime updated_at
    }

    user_preferences {
        int user_id PK,FK
        string theme
        boolean email_notifications
        datetime updated_at
    }

    ideas {
        int id PK
        int user_id FK
        string title
        text description
        text problem
        text solution
        text target_customer
        string industry
        string business_model
        string revenue_model
        string pricing
        int version
        string webhook_url
        boolean is_deleted
        datetime created_at
        datetime updated_at
    }

    validation_sessions {
        string id PK
        int user_id FK
        int idea_id FK
        string title
        string status
        json extracted_data
        float completeness_score
        boolean is_deleted
        datetime created_at
        datetime updated_at
    }

    conversation_messages {
        int id PK
        string session_id FK
        string role
        text content
        string client_message_id UK
        datetime created_at
    }

    validation_results {
        int id PK
        int idea_id FK
        string session_id FK
        int version
        float overall_score
        string classification
        float confidence_score
        json confidence_breakdown
        json score_overrides
        json pipeline_timing
        boolean is_pinned
        datetime created_at
    }

    validation_scores {
        int id PK
        int validation_result_id FK
        string parameter_name
        float raw_score
        float verified_score
        float weight
        float weighted_score
        string justification
    }

    embeddings {
        int id PK
        int idea_id FK
        text text_hash
        json vector
        int dimensions
        datetime created_at
    }

    recommendations {
        int id PK
        int validation_result_id FK
        string title
        text description
        string priority
        string category
        float potential_score_gain
        string status
        datetime created_at
    }

    competitors {
        int id PK
        int validation_result_id FK
        string name
        float similarity_score
        string overlap_level
        json shared_keywords
        datetime created_at
    }

    evidence {
        int id PK
        int validation_result_id FK
        string source_name
        string source_type
        text claim
        string url
        float credibility_score
    }

    audit_logs {
        int id PK
        int validation_result_id FK
        string event_type
        text input_hash
        float score
        datetime created_at
    }

    pipeline_jobs {
        string id PK
        int idea_id FK
        string status
        string error
        datetime created_at
        datetime completed_at
    }

    user_feedback {
        int id PK
        int user_id FK
        int validation_result_id FK
        int rating
        text comments
        datetime created_at
    }
```

---

## Figure 3.5: Module Dependency & Component Hierarchy

```mermaid
graph TD
    AUTH["Module 1: Authentication & RBAC"] --> CHAT["Module 2: Conversational Co-Pilot"]
    AUTH --> IDEA["Module 10: Idea History & Versioning"]
    AUTH --> DASH["Module 11: Telemetry Dashboard"]
    
    CHAT --> PIPELINE["Module 3: 15-Layer Validation Pipeline"]
    IDEA --> PIPELINE
    
    PIPELINE --> VEC["Module 4: Vector Embeddings & Similarity"]
    PIPELINE --> RULE["Module 5: Deterministic Rules & Overrides"]
    PIPELINE --> SCORE["Module 6: Authoritative 9-Dim Scoring"]
    PIPELINE --> CONF["Module 7: Calibrated Confidence Engine"]
    PIPELINE --> REC["Module 8: Strategic Recommendations"]
    
    PIPELINE --> COMPARE["Module 9: Multi-Idea Comparison Matrix"]
    PIPELINE --> DASH
    
    SCORE --> VISUAL["Frontend 7-Parameter Visual Rollup"]
```
