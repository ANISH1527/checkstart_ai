# 10. System Architecture & Data Flow Diagrams

This document illustrates the end-to-end technical architecture, network boundaries, protocol flows, and data transitions of CheckStart AI using 7 detailed Mermaid diagrams.

---

## 1. High-Level System Architecture

```mermaid
graph TD
    Client["Client Web Browser<br/>(React 18 / TypeScript / Tailwind)"]
    ViteProxy["Vite Dev Server Proxy<br/>Port 5173 -> :8000"]
    FastAPI["FastAPI Web Application<br/>Port 8000 (Uvicorn ASGI)"]
    
    subgraph Security_and_Validation ["Middleware & Security"]
        Limiter["SlowAPI Rate Limiter"]
        AuthMiddleware["OAuth2 Bearer JWT Authenticator"]
        PydanticVal["Pydantic v2 Request Sanitizer"]
    end

    subgraph Service_Core ["Core Business Logic Services"]
        ChatEngine["ChatService<br/>(Conversational Engine)"]
        ValPipeline["ValidationService<br/>(15-Layer Engine)"]
        ScoringEng["ScoringService<br/>(9-Dim Weighted Model)"]
        CompareEng["Comparisons Engine<br/>(Multi-Idea Matrix)"]
    end

    subgraph Async_Worker ["Asynchronous Processing"]
        RedisBroker[("Redis Broker & Cache<br/>Port 6379")]
        CeleryWorker["Celery Worker Tasks<br/>(run_validation_pipeline_task)"]
    end

    subgraph Storage_Layer ["Data Tier"]
        DB[("PostgreSQL 16 / SQLite<br/>Port 5432 / startup_validation.db")]
        ExtLLM["Google Gemini Pro API<br/>(Cloud LLM Inference)"]
        ExtWebhook["External Consumer Webhook<br/>(HTTP POST Notification)"]
    end

    Client -->|HTTPS / JSON| ViteProxy
    ViteProxy -->|HTTP / JSON| FastAPI
    FastAPI --> Limiter --> AuthMiddleware --> PydanticVal
    PydanticVal --> ChatEngine & ValPipeline & ScoringEng & CompareEng

    ChatEngine --> DB
    ValPipeline --> DB
    ValPipeline --> ExtLLM
    ValPipeline --> RedisBroker

    FastAPI -.->|Queue Task| RedisBroker
    RedisBroker -.->|Pull Task| CeleryWorker
    CeleryWorker --> ValPipeline
    CeleryWorker -.->|HTTP POST| ExtWebhook
    
    DB --- SQLAlchemy["SQLAlchemy ORM + Alembic"]
```

---

## 2. Frontend-to-Backend Communication Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Founder as Student Founder
    participant UI as React Frontend (SPA)
    participant Client as API Client (api.ts)
    participant Backend as FastAPI Router
    participant Service as ChatService / ValidationService
    participant DB as Relational Database

    Founder->>UI: Enters idea details in chat
    UI->>Client: api.sendMessage(conversationId, message)
    Client->>Client: Inject Authorization: Bearer <JWT>
    Client->>Backend: POST /api/conversations/{id}/messages
    Backend->>Backend: SlowAPI rate limit check (30/min)
    Backend->>Backend: Verify JWT & extract user_id
    Backend->>Service: process_user_message()
    Service->>Service: NLPService extracts problem, customer, revenue
    Service->>DB: INSERT into conversation_messages
    Service->>DB: UPDATE validation_sessions (completeness_score)
    Service->>Backend: Return { userMessage, assistantMessage, structuredData }
    Backend->>Client: HTTP 200 { success: true, data: { ... } }
    Client->>Client: handleResponse() unwraps data
    Client->>UI: Return structured response
    UI->>Founder: Update chat UI with SafeMarkdown & progress gauge
```

---

## 3. Third-Party API Integration Diagram

```mermaid
graph LR
    subgraph CheckStart_Backend ["CheckStart AI Backend"]
        GeminiProvider["GeminiProvider<br/>(app/services/llm_providers)"]
        CompareService["Comparisons Router<br/>(app/api/comparisons.py)"]
        AuthRouter["Auth Router<br/>(app/api/auth.py)"]
        TaskWorker["Celery Tasks<br/>(app/services/tasks.py)"]
    end

    subgraph Google_Cloud ["Google Cloud Platform"]
        GeminiAPI["Google Generative AI API<br/>(models/gemini-pro:generateContent)"]
        GoogleGIS["Google Identity Services<br/>(OAuth 2.0 Credential Verification)"]
    end

    subgraph External_Webhooks ["External Client Systems"]
        WebhookConsumer["Incubator / Founder Webhook URL<br/>(Custom HTTPS Listener)"]
    end

    GeminiProvider -->|SDK Call / API Key| GeminiAPI
    CompareService -->|SDK Call / API Key| GeminiAPI
    AuthRouter -->|Token Claims / GIS| GoogleGIS
    TaskWorker -->|HTTP POST with 3x Retry| WebhookConsumer
```

---

## 4. Database Interaction & Model Relationship Diagram

```mermaid
sequenceDiagram
    autonumber
    participant Pipeline as ValidationService
    participant Repo as ValidationRepository
    participant DB as Database Engine (SQLAlchemy)

    Pipeline->>Repo: create_validation_result(idea_id, version, overall_score, ...)
    Repo->>DB: INSERT INTO validation_results RETURNING id
    DB-->>Repo: validation_id: 42
    
    Pipeline->>Repo: save_scores(42, 9_parameter_scores)
    Repo->>DB: Bulk INSERT 9 rows INTO validation_scores
    
    Pipeline->>Repo: save_evidence(42, evidence_list)
    Repo->>DB: Bulk INSERT INTO evidence
    
    Pipeline->>Repo: save_competitors(42, competitors_list)
    Repo->>DB: Bulk INSERT INTO competitors
    
    Pipeline->>Repo: save_recommendations(42, prioritized_recs)
    Repo->>DB: Bulk INSERT INTO recommendations
    
    Pipeline->>Repo: create_audit_log(42, 'VALIDATION_COMPLETED', metadata)
    Repo->>DB: INSERT INTO audit_logs
    
    Pipeline->>DB: COMMIT TRANSACTION
```

---

## 5. Authentication Flow Diagram (Local & Google OAuth)

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Student Founder
    participant UI as React UI (LoginPage)
    participant GIS as Google Identity Services
    participant API as FastAPI /auth Router
    participant DB as Database (users table)
    participant JWT as python-jose (HS256)

    alt Local Email / Password Login
        User->>UI: Submits email & password
        UI->>API: POST /api/v1/auth/login
        API->>DB: SELECT * FROM users WHERE email = :email
        API->>API: bcrypt.checkpw(plain_password, password_hash)
        alt Password Valid
            API->>JWT: create_access_token(sub=user.id, exp=60m)
            API-->>UI: HTTP 200 { access_token, user, token_type: "bearer" }
            UI->>UI: Save token to localStorage ('auth_token')
        else Password Invalid
            API-->>UI: HTTP 401 Unauthorized ("Incorrect email or password")
        end
    else Google One Tap / Button OAuth Login
        User->>GIS: Authenticates with Google account
        GIS-->>UI: Returns Credential JWT (ID Token)
        UI->>API: POST /api/v1/auth/google { credential: "..." }
        API->>API: Decode ID token claims (sub, email, name, picture)
        API->>DB: SELECT * FROM users WHERE google_sub = :sub OR email = :email
        opt User Does Not Exist
            API->>DB: INSERT INTO users (name, email, google_sub, auth_provider='GOOGLE')
            API->>DB: INSERT INTO user_profiles & user_preferences
        end
        API->>JWT: create_access_token(sub=user.id, exp=60m)
        API-->>UI: HTTP 200 { access_token, user }
        UI->>UI: Save token to localStorage
    end
```

---

## 6. AI/ML 15-Layer Pipeline Flow Diagram

```mermaid
flowchart TD
    Start([Input: Startup Idea Payload]) --> L1[Layer 1: Structural Profile Extraction]
    L1 --> L2[Layer 2: NLP Attribute Extraction]
    L2 --> L3[Layer 3: 384-Dim Vector Embedding Generation]
    L3 --> CacheCheck{Embedding in Redis Cache?}
    CacheCheck -- Yes --> Hit[Cache Hit: Load Vector]
    CacheCheck -- No --> Miss[Cache Miss: SentenceTransformers & Cache Write]
    Hit & Miss --> L4[Layer 4: Cosine Similarity Matching Against Database]
    L4 --> L5[Layer 5: Deterministic Rule Engine Checks]
    L5 --> L6[Layer 6: Evidence Retrieval & Source Classification]
    L6 --> L7[Layer 7: LLM Analysis Inference]
    L7 --> LLMCheck{Gemini Healthy & API Key Set?}
    LLMCheck -- Yes --> GeminiCall[Google Gemini Pro API]
    LLMCheck -- No --> MockCall[MockProvider Profile-Aware Heuristics]
    GeminiCall & MockCall --> L8[Layer 8: Verification Layer & Score Overrides]
    L8 --> L9[Layer 9: Authoritative 9-Parameter Weighted Scoring]
    L9 --> L10[Layer 10: Calibrated Statistical Confidence Formula]
    L10 --> L11[Layer 11: Information Gap Identification]
    L11 --> L12[Layer 12: Root Cause Failure Analysis]
    L12 --> L13[Layer 13: Improvement Strategy Generation]
    L13 --> L14[Layer 14: Action Prioritization & Top-3 Ranking]
    L14 --> L15[Layer 15: Score Impact Prediction]
    L15 --> Persist[(Database Commit: ValidationResult & 9 Scores)]
    Persist --> End([Output: Complete 7-Parameter Rollup Report])
```

---

## 7. Containerized Deployment Architecture Diagram

```mermaid
graph TD
    subgraph Host_Machine ["Docker Host Infrastructure"]
        subgraph Docker_Network ["Docker Bridge Network: startup_network"]
            Nginx["Frontend Web Server<br/>Port 80 / 443<br/>(Serves React Static Dist)"]
            
            AppContainer["FastAPI App Container<br/>Port 8000 (Python 3.10-slim)<br/>(Uvicorn ASGI)"]
            
            CeleryContainer["Celery Worker Container<br/>(Background Pipeline Tasks)"]
            
            PostgresContainer[("PostgreSQL 16 Alpine<br/>Port 5432<br/>(Volume: pg_data)")]
            
            RedisContainer[("Redis 7 Alpine<br/>Port 6379<br/>(Volume: redis_data)")]
        end
    end

    Internet(("Public Internet / Founders")) -->|Port 80/443| Nginx
    Nginx -->|Proxy /api| AppContainer
    AppContainer -->|Database Connection Pool| PostgresContainer
    AppContainer -->|Cache & Message Queue| RedisContainer
    CeleryContainer -->|Consume Queue| RedisContainer
    CeleryContainer -->|Read/Write Results| PostgresContainer
    AppContainer -.->|Outbound HTTPS| GeminiCloud["Google AI Studio API"]
    CeleryContainer -.->|Outbound HTTPS| WebhookDest["External Webhook Consumers"]
```
