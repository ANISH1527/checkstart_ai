# 04. Backend Deep-Dive Documentation

This document details the internal architecture, lifecycle, middleware execution order, business logic services, data pipelines, and error handling of the FastAPI backend.

---

## 1. Application Entry Point & Server Startup Lifecycle

The backend entry point is located in `backend/app/main.py`.

```
[uvicorn app.main:app]
   │
   ├── 1. setup_logging() (app/core/logging.py)
   │      - Formats structlog into JSON in production or ConsoleRenderer in development
   │
   ├── 2. Base.metadata.create_all(bind=engine)
   │      - Ensures tables exist on dev SQLite startup
   │
   ├── 3. asynccontextmanager lifespan(app: FastAPI)
   │      ├── DB Connectivity Check: Executes `SELECT 1` on database engine
   │      ├── Redis Connectivity Check: Executes `r.ping()` with 2s timeout
   │      └── Production Guard: If settings.is_production and (!db_ok or !redis_ok) → raises RuntimeError
   │
   ├── 4. FastAPI Application Instantiation
   │      - Title: "AI Startup Idea Validation API"
   │      - OpenAPI: `/api/v1/openapi.json`, Swagger UI: `/docs`, ReDoc: `/redoc`
   │
   ├── 5. Exception Handlers & Middleware Registration
   │      - SlowAPI RateLimitExceeded handler
   │      - RequestValidationError handler (field-level details)
   │      - HTTPException handler (standard error codes)
   │      - Global Exception handler (unhandled exception catcher)
   │      - CORSMiddleware (Origins: localhost:5173, localhost:3000, localhost:5174)
   │
   └── 6. Router Mounting Loop (Lines 237-255)
          - Mounts 11 APIRouters under both `/api/v1` and `/api`
```

---

## 2. Middleware Stack & Execution Order

FastAPI processes incoming HTTP requests through the following middleware chain:

1. **SlowAPI Rate Limiter State (`app.state.limiter = limiter`)**:
   - Initialized in `app/core/limiter.py` using `get_remote_address`.
   - Tracks request velocity per IP address against endpoint limits (e.g. `5/minute` on `/auth/login`, `20/minute` on `/ideas/{id}/validate`).
2. **CORS Middleware (`CORSMiddleware`)**:
   - Allowed Origins: `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`, `http://localhost:5174`, `http://127.0.0.1:5174`.
   - `allow_credentials = True`
   - `allow_methods = ["*"]`
   - `allow_headers = ["*"]`
3. **Pydantic Request Validation**:
   - Parses JSON body against declared Pydantic schemas.
   - Throws `RequestValidationError` (HTTP 422) if required fields are missing or type coercion fails.
4. **Exception Handling Pipeline**:
   - Standardizes all API output into consistent envelopes:
     - Success: `{ "success": true, "data": { ... }, "meta": { ... } }`
     - Error: `{ "success": false, "error": "<error_code>", "message": "<human_msg>", "details": { ... } }`

---

## 3. Dependency Injection & Security Guards

Located in `backend/app/core/dependencies.py`:

- **Database Session (`get_db`)**:
  - Injected via `db: Session = Depends(get_db)`.
  - Yields a scoped `SessionLocal` and ensures `db.close()` in the `finally` block.
- **Authentication Guard (`get_current_user`)**:
  - Uses `oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")`.
  - Extracts Bearer token from `Authorization` header.
  - Decodes token via `verify_access_token(token)` using `JWT_SECRET_KEY` and `HS256`.
  - Queries `UserRepository.get_by_id(user_id)`.
  - Returns authenticated `User` OR raises `HTTP 401 Unauthorized`.
- **Role-Based Access Control (`require_admin`)**:
  - Depends on `get_current_user`.
  - Asserts `user.role == "ADMIN"`.
  - Returns user OR raises `HTTP 403 Forbidden` (`"Admin privileges required."`).

---

## 4. Business Logic Services Layer

| Service Name | Source File | Core Responsibility |
| :--- | :--- | :--- |
| **ValidationService** | `app/services/validation_service.py` | Central orchestrator for the 15-layer evaluation pipeline and multi-version comparisons. |
| **ChatService** | `app/services/chat_service.py` | Socratic conversational mentor, rolling context state machine, and entity extraction. |
| **ScoringService** | `app/services/scoring_service.py` | 9-dimensional weighted arithmetic engine, 7-parameter visual rollup, and 5-band classification. |
| **VerificationService** | `app/services/verification_service.py` | Layer 8 deterministic verification rules, anti-marketing caps, and score override auditing. |
| **ConfidenceService** | `app/services/confidence_service.py` | Calibrated statistical confidence scoring with deduction rules for mock mode and brevity. |
| **EmbeddingService** | `app/services/embedding_service.py` | Generates 384-dimensional dense vectors using `all-MiniLM-L6-v2` with deterministic mock fallback. |
| **EmbeddingCacheService** | `app/services/embedding_cache_service.py` | Redis caching for vector embeddings and similarity computations with in-memory dict fallback. |
| **SimilarityService** | `app/services/similarity_service.py` | Vector cosine similarity calculation, shared keyword extraction, and external competitor flagging. |
| **RuleService** | `app/services/rule_service.py` | Input quality checks: minimum word count, problem completeness, prompt injection detection. |
| **EvidenceService** | `app/services/evidence_service.py` | Evidence classification layer tagging domain sources as `VERIFIED`, `ESTIMATED`, or `GENERATED`. |
| **NLPService** | `app/services/nlp_service.py` | Keyword frequency extraction, sentence splitting, and heuristic entity cues. |
| **InformationGapService** | `app/services/information_gap_service.py` | Identifies missing operational elements (unit economics, churn mitigation, sales cycle). |
| **RecommendationEngineService** | `app/services/recommendation_engine_service.py` | Layers 12-15 orchestrator: root causes, strategies, action prioritization, and impact prediction. |
| **ReportService** | `app/services/report_service.py` | Generates formatted GitHub Markdown validation report strings. |

---

## 5. End-to-End Endpoint Execution Flows

### Flow 1: Conversational Chat & Attribute Extraction
```
POST /api/v1/sessions/{id}/messages
  → SlowAPI Rate Limiter (30/min)
  → JSON body parsing: SendMessageRequest
  → Controller: sessions.py:send_message()
  → Service: ChatService.process_user_message()
      1. Idempotency check on client_message_id
      2. Store user message in conversation_messages
      3. NLPService extracts attributes & updates completeness_score
      4. Idea record created/updated in ideas table
      5. Prompt injection regex guardrail check
      6. Socratic prompt formatted and sent to LLMProvider (or MockProvider)
      7. Store assistant reply in conversation_messages
  → Response: { userMessage, assistantMessage, structuredData }
```

### Flow 2: Synchronous 15-Layer Validation Pipeline
```
POST /api/v1/validation/analyze/{idea_id}
  → Middleware: CORS & Exception Handlers
  → Auth Dependency: get_current_user (Bearer JWT)
  → Controller: reports.py:analyze_idea_direct()
  → Service: ValidationService.run_validation_pipeline()
      Layer 1:  IdeaProfileExtractor.extract_profile()
      Layer 2:  NLPService.extract_attributes()
      Layer 3:  EmbeddingService.generate_embedding() + DB save
      Layer 4:  SimilarityService.find_similar_ideas() (Cache check + cosine similarity)
      Layer 5:  RuleService.evaluate_rules()
      Layer 6:  EvidenceService.fetch_evidence()
      Layer 7:  LLMProvider.generate_validation_analysis() (Gemini Pro or Mock)
      Layer 8:  VerificationService.verify() (Applies score overrides)
      Layer 9:  ScoringService.calculate_scores() (9-parameter weighted math)
      Layer 10: ConfidenceService.calculate_confidence() (Calibrated confidence score)
      Layer 11: InformationGapService.detect_gaps()
      Layer 12: RootCauseService.analyze_root_causes()
      Layer 13: ImprovementStrategyService.generate_strategies()
      Layer 14: ActionPrioritizationService.prioritize_actions()
      Layer 15: ImprovementImpactService.predict_impacts()
  → Database:
      INSERT into validation_results
      INSERT 9 rows into validation_scores
      INSERT into evidence, competitors, recommendations, audit_logs
  → Response: Full validation report envelope with 7-parameter rollup
```

### Flow 3: Multi-Idea Comparison Flow
```
POST /api/v1/ideas/compare
  → Auth Dependency: get_current_user
  → Schema Validation: CompareRequest (ensures 2 to 4 unique idea IDs)
  → Controller: comparisons.py:_execute_comparison()
  → Verification: Checks that caller owns all ideas and all ideas have completed reports on framework v1.0
  → Aggregation: Pulls 7-parameter scores for each idea
  → AI Synthesis: Calls Gemini Pro to produce comparative venture analysis (or heuristic fallback)
  → Response: SuccessResponse({ ideas, rankedOrder, comparisonSummary })
```

---

## 6. Background Jobs & Asynchronous Tasks

Defined in `backend/app/services/tasks.py` and `app/core/celery_app.py`:

- **Task Queue**: Celery with Redis broker (`redis://localhost:6379/0`).
- **Validation Task (`run_validation_pipeline_task(idea_id)`)**:
  - Updates `pipeline_jobs` table status to `RUNNING`.
  - Instantiates `ValidationService(db)` and executes `run_validation_pipeline(idea)`.
  - On success: sets `pipeline_jobs.status = "COMPLETED"`, sets `pipeline_jobs.result_id`.
  - Dispatches outbound HTTP webhook notification if `idea.webhook_url` is configured.
  - On error: rolls back DB transaction, sets `pipeline_jobs.status = "FAILED"`, logs error trace.

---

## 7. Code Weaknesses & Architecture Debt Audit

1. **Deprecated Datetime Call**: `datetime.utcnow()` is used across models, services, and routers. In Python 3.12+, `utcnow()` is deprecated and produces compiler warnings; it should be migrated to `datetime.now(timezone.utc)`.
2. **Pydantic V1 Compatibility Calls**: `r.dict()` is used in `validation_service.py` lines 210, 380, 381, 382 instead of Pydantic V2 `model_dump()`.
3. **Double Router Registration**: In `main.py:251-255`, every router is registered under `settings.API_V1_STR` (`/api/v1`) and registered a second time under `/api`. While this ensures backward compatibility with the frontend Vite proxy, it duplicates the route table in OpenAPI docs.
4. **Hardcoded Fallback JWT Secret**: In `backend/app/core/config.py:12`, default JWT secret is set to `"default-insecure-secret-key-change-me-1234567890"`. If `JWT_SECRET_KEY` is omitted from production `.env`, the server boots with this predictable key.
