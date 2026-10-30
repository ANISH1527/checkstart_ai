# 03. Complete API Inventory (Highest Priority)

This document provides a complete, evidence-based inventory of every external API, internal REST endpoint, SDK client, webhook, and service integration in the project. Every row is verified against actual source code lines.

---

## 1. External Third-Party APIs & Cloud Integrations

| Field | Google Generative AI (Gemini Pro) | Google Identity Services (GIS OAuth) | Outbound Webhook Dispatcher |
| :--- | :--- | :--- | :--- |
| **API/Service Name** | Google Generative AI (`google-generativeai`) | Google Identity Services OAuth 2.0 | Generic Outbound Webhook Service |
| **API Category** | External LLM Cloud SDK / REST | External Identity Provider (OIDC / OAuth2) | Outbound HTTP Webhook (Push) |
| **Purpose** | Venture validation, parameter scoring, weakness analysis, and comparative venture synthesis | One-tap and credential sign-in for collegiate student founders | Notify external systems (e.g., incubator portal, Slack) upon validation completion |
| **Base URL** | `https://generativelanguage.googleapis.com` (encapsulated by SDK) | `https://accounts.google.com` (GIS client library) | Dynamic per idea: `idea.webhook_url` |
| **Endpoint / Path** | `models/gemini-pro:generateContent` | ID Token verification / user profile claims | Custom consumer endpoint (e.g., `/webhook/checkstart`) |
| **HTTP Method** | SDK method `model.generate_content(...)` (underlying `POST`) | `POST` (credential exchange from client) | `POST` |
| **Request Parameters** | None (SDK abstraction) | None | None |
| **Request Body** | Formatted prompt string (`v1.0` - `v1.3`) containing title, description, problem, solution, customer, industry, business model | `{ credential: "<JWT_ID_TOKEN>", email, name, googleId, profileImage }` | JSON payload: `{ idea_id, job_id, status: "COMPLETED", overall_score, classification }` |
| **Authentication** | API Key passed via `genai.configure(api_key=...)` | Google Client ID: `VITE_GOOGLE_CLIENT_ID` | Optional consumer token (none explicitly attached in dispatcher) |
| **Headers** | Handled by Google SDK (`x-goog-api-key`) | Handled by Google Client Library | `Content-Type: application/json` |
| **Response Format** | LLM text stream containing JSON block `{ market_demand: { score, confidence, reason }, ... }` | JWT payload containing `sub`, `email`, `name`, `picture` | HTTP 2xx acknowledgement expected |
| **Calling File & Line** | `backend/app/services/llm_providers/gemini_provider.py:54-75`, `backend/app/api/comparisons.py:44-58` | `frontend/src/pages/LoginPage.tsx:45-70`, `backend/app/api/auth.py:165-252` | `backend/app/services/tasks.py:77-90` (`dispatch_webhook_notification`) |
| **Trigger** | Triggered during Layer 7 of pipeline validation, or during multi-idea comparison | User clicks "Sign in with Google" or GIS One Tap prompt activates | Triggered in Celery task completion when `idea.webhook_url` is non-null |
| **Environment Variables**| `GEMINI_API_KEY`, `LLM_PROVIDER` | `VITE_GOOGLE_CLIENT_ID` | None (read from `ideas.webhook_url` column) |
| **Error Handling** | If API key is missing or call throws exception, gracefully triggers `_fallback_result()` (`MockProvider`), logs `llm_fallback_triggered` | If token decoding fails, logs warning and falls back to raw payload fields; returns HTTP 400 if email missing | 3 retry attempts with exponential backoff (`0.1 * 2^attempt`), logs failure upon 3 failed attempts |
| **Status** | **Verified Active with Fallback** (Auto-degrades to `MockProvider` when key unavailable) | **Verified Active** (Decodes claims; needs cryptographic signature hardening in prod) | **Verified Implemented** (Fires in Celery worker when `webhook_url` is configured) |

---

## 2. Complete Internal Backend REST API Inventory

All routes are mounted on both `/api/v1` and `/api` (via `backend/app/main.py:251-255`):

```
Prefix 1: /api/v1/... (Canonical OpenAPI specification)
Prefix 2: /api/...    (Frontend Vite proxy compatibility)
```

### Authentication & User Management Endpoints (`app/api/auth.py`, `users.py`, `profile_settings.py`)

| Endpoint Path | HTTP Method | Request Body / Params | Auth Required | Calling File & Function | Purpose & Response Format | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/auth/register` | `POST` | `UserRegister`: `{ name, email, password, college?, course?, graduationYear? }` | None (Rate limit: 5/min) | `frontend/src/services/api.ts:85` (`api.register`) | Registers user, creates profile & preferences, returns JWT token + user object. | **Verified Active** |
| `/auth/login` | `POST` | `UserLogin` or form data: `{ email/username/identifier, password }` | None (Rate limit: 5/min) | `frontend/src/services/api.ts:101` (`api.login`) | Verifies bcrypt password, updates `last_login_at`, returns JWT token + user object. | **Verified Active** |
| `/auth/google` | `POST` | `GoogleAuthRequest`: `{ credential?, email?, name?, googleId?, profileImage?, college?, course?, graduationYear? }` | None | `frontend/src/services/api.ts:115` (`api.googleAuth`) | Decodes GIS credential, auto-provisions user/profile, returns JWT token + user object. | **Verified Active** |
| `/auth/admin/login` | `POST` | `AdminLoginRequest`: `{ email/username, password }` | None | `frontend/src/services/api.ts:133` (`api.adminLogin`) | Verifies admin password, checks `role == "ADMIN"`, returns admin JWT. | **Verified Active** |
| `/auth/me` | `GET` | None | Bearer Token (`get_current_user`) | `frontend/src/services/api.ts:146` (`api.getMe`), `AuthContext.tsx:36` | Returns authenticated user details and counts of ideas/conversations. | **Verified Active** |
| `/users/me` | `GET` | None | Bearer Token (`get_current_user`) | Backend testing / OpenAPI | Canonical user schema response. | **Verified Active** |
| `/auth/forgot-password` | `POST` | `ForgotPasswordRequest`: `{ email }` | None | `frontend/src/services/api.ts:153` (`api.forgotPassword`) | Generates a 15-minute JWT reset token (`purpose="password_reset"`). In dev returns `devToken`. | **Verified Active** |
| `/auth/reset-password` | `POST` | `ResetPasswordRequest`: `{ token, password }` | None | `frontend/src/services/api.ts:162` (`api.resetPassword`) | Verifies reset token, updates bcrypt password hash in DB. | **Verified Active** |
| `/user/profile` | `GET` | None | Bearer Token | `frontend/src/services/api.ts:339` (`api.getProfile`) | Returns collegiate profile (`college`, `course`, `graduationYear`). | **Verified Active** |
| `/user/profile` | `PUT` | `ProfileUpdateRequest`: `{ name?, college?, course?, graduationYear? }` | Bearer Token | `frontend/src/services/api.ts:346` (`api.updateProfile`) | Updates collegiate founder profile details in `user_profiles`. | **Verified Active** |
| `/user/password` | `PUT` | `PasswordUpdateRequest`: `{ currentPassword, newPassword }` | Bearer Token | `frontend/src/services/api.ts:360` (`api.updatePassword`) | Verifies existing password, hashes new password with bcrypt. | **Verified Active** |
| `/user/verify-delete` | `POST` | `VerifyDeleteRequest`: `{ password?, googleEmail?, credential? }` | Bearer Token | `frontend/src/services/api.ts:372` (`api.verifyDeleteIdentity`) | Issues single-use 10-minute deletion token (`purpose="account_delete"`). | **Verified Active** |
| `/user/account` | `DELETE` | `DeleteAccountRequest`: `{ confirmText, verificationToken }` | Bearer Token | `frontend/src/services/api.ts:385` (`api.deleteAccount`) | Enforces `confirmText == "DELETE"`, decodes token, cascades deletes user & data. | **Verified Active** |
| `/user/settings` | `GET` | None | Bearer Token | `frontend/src/services/api.ts:397` (`api.getSettings`) | Returns preferences: theme (`light/dark/system`) and email notifications. | **Verified Active** |
| `/user/settings` | `PUT` | `SettingsUpdateRequest`: `{ theme?, emailNotifications? }` | Bearer Token | `frontend/src/services/api.ts:404` (`api.updateSettings`) | Updates user theme and notification flags in `user_preferences`. | **Verified Active** |

---

### Conversational Validation Sessions (`app/api/sessions.py`)

| Endpoint Path | HTTP Method | Request Body / Params | Auth Required | Calling File & Function | Purpose & Response Format | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/sessions` & `/conversations` | `POST` | `{ initialMessage?: string }` | Bearer Token | `frontend/src/services/api.ts:186` (`api.createConversation`) | Creates new `ValidationSession` and initializes idea context. Returns session object. | **Verified Active** |
| `/sessions` & `/conversations` | `GET` | None | Bearer Token | `frontend/src/services/api.ts:179` (`api.getConversations`) | Lists all active non-deleted validation sessions for user with completeness score. | **Verified Active** |
| `/sessions/{id}` & `/conversations/{id}` | `GET` | Path: `id` (UUID) | Bearer Token | `frontend/src/services/api.ts:195` (`api.getConversation`) | Returns full conversation session, messages, extracted context, and latest score. | **Verified Active** |
| `/sessions/{id}/messages` | `GET` | Query: `cursor?`, `limit=50` | Bearer Token | `frontend/src/services/api.ts` (`api.get`) | Returns paginated conversation messages for session. | **Verified Active** |
| `/sessions/{id}/messages` | `POST` | `{ message?: string, client_message_id?: string }` | Bearer Token (Rate limit: 30/min) | `frontend/src/services/api.ts:202` (`api.sendMessage`) | Processes user chat, extracts attributes, updates completeness, returns AI reply. | **Verified Active** |
| `/sessions/{id}/messages/stream` | `POST` | `{ message?: string }` | Bearer Token | Experimental stream client | Server-Sent Events (SSE) endpoint streaming assistant response chunks. | **Verified Active** |
| `/sessions/{id}/validate` | `POST` | Header: `Idempotency-Key?` | Bearer Token (Rate limit: 15/min) | `frontend/src/services/api.ts:219` (`api.validateConversation`) | Triggers 15-layer validation directly from conversational context. Returns report ID. | **Verified Active** |
| `/sessions/{id}` & `/conversations/{id}` | `DELETE` | Path: `id` | Bearer Token | `frontend/src/services/api.ts:236` (`api.deleteConversation`) | Soft deletes conversation session (`is_deleted = True`). | **Verified Active** |

---

### Startup Ideas Management (`app/api/ideas.py`)

| Endpoint Path | HTTP Method | Request Body / Params | Auth Required | Calling File & Function | Purpose & Response Format | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/ideas` | `POST` | `IdeaCreate`: `{ title, description, problem?, solution?, target_customer?, industry?, business_model?, revenue_model?, pricing?, technology? }` | Bearer Token | `frontend/src/services/api.ts:286` (`api.createIdea`) | Creates startup idea record in `ideas` table. Returns formatted idea object. | **Verified Active** |
| `/ideas` | `GET` | Query: `search?`, `category?`, `sort?`, `classification?`, `min_score?`, `max_score?`, `limit=20`, `offset=0` | Bearer Token | `frontend/src/services/api.ts:252` (`api.getIdeas`) | Lists user ideas with search filters, latest report preview, and report count. | **Verified Active** |
| `/ideas/{idea_id}` | `GET` | Path: `idea_id` (int) | Bearer Token | `frontend/src/services/api.ts:268` (`api.getIdeaById`) | Returns single idea with latest report summary and linked conversation ID. | **Verified Active** |
| `/ideas/{idea_id}` | `PUT` | `IdeaUpdate`: `{ title?, description?, problem?, solution?, target_customer?, ... }` | Bearer Token | `frontend/src/services/api.ts:295` (`api.updateIdea`) | Updates idea metadata and attributes. | **Verified Active** |
| `/ideas/{idea_id}` | `DELETE` | Path: `idea_id`, Query: `hard=false` | Bearer Token (Hard requires Admin) | `frontend/src/services/api.ts:304` (`api.deleteIdea`) | Soft deletes idea (sets `is_deleted = True`). HTTP 204 No Content. | **Verified Active** |
| `/ideas/{idea_id}/reports` | `GET` | Path: `idea_id` | Bearer Token | `frontend/src/services/api.ts:275` (`api.getIdeaReports`) | Returns list of all validation report versions for an idea with 7-parameter scores. | **Verified Active** |
| `/ideas/{idea_id}/history` | `GET` | Query: `limit=10`, `offset=0` | Bearer Token | `backend/app/api/history.py:18` | Returns paginated historical validation scores and classifications. | **Verified Active** |

---

### Validation Pipeline & Reports (`app/api/validation.py`, `reports.py`)

| Endpoint Path | HTTP Method | Request Body / Params | Auth Required | Calling File & Function | Purpose & Response Format | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/ideas/{idea_id}/validate` | `POST` | Path: `idea_id` | Bearer Token (Rate limit: 20/min) | Background task invocation | Queues Celery validation task `run_validation_pipeline_task.delay(idea.id)`. | **Verified Active** |
| `/ideas/{idea_id}/revalidate`| `POST` | Path: `idea_id` | Bearer Token | Manual revalidation trigger | Increments idea version, queues Celery validation task. | **Verified Active** |
| `/ideas/{idea_id}/validation/status` | `GET` | Query: `job_id?` | Bearer Token | Background polling | Returns Celery task status (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`). | **Verified Active** |
| `/ideas/{idea_id}/validation`| `GET` | Query: `version?` | Bearer Token | Direct idea validation lookup | Returns 9-dimensional validation response with evidence, competitors, recommendations. | **Verified Active** |
| `/validation/analyze/{idea_id}` | `POST` | Path: `idea_id` | Bearer Token | `frontend/src/services/api.ts:313` (`api.analyzeIdea`) | Executes synchronous on-demand validation pipeline. Returns full report payload. | **Verified Active** |
| `/validation/{report_id}` & `/reports/{report_id}` | `GET` | Path: `report_id` (int) | Bearer Token | `frontend/src/services/api.ts:321` (`api.getReport`) | Looks up validation report directly by `report_id` (or fallback `idea_id`). | **Verified Active** |
| `/ideas/{idea_id}/recommendations/{rec_id}/complete` | `POST` | Path: `idea_id`, `rec_id` | Bearer Token | Interactive recommendation checklist | Toggles recommendation status between `OPEN` and `COMPLETED`. | **Verified Active** |
| `/ideas/{idea_id}/comparison` | `GET` | Query: `v1?`, `v2?` | Bearer Token | Version comparison view | Compares two validation versions of the same idea, returns score delta & parameter deltas. | **Verified Active** |
| `/reports/{idea_id}/markdown`| `GET` | Path: `idea_id` | Bearer Token | Markdown export | Returns plain text GitHub-flavored Markdown report. | **Verified Active** |

---

### Dashboard & Analytics Endpoints (`app/api/dashboard.py`)

| Endpoint Path | HTTP Method | Request Body / Params | Auth Required | Calling File & Function | Purpose & Response Format | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/dashboard/stats` & `/ideas/dashboard/stats` | `GET` | None | Bearer Token | `frontend/src/services/api.ts:245` (`api.getDashboardStats`) | Returns founder overview: total ideas, validations, avg score, categories, timeline. | **Verified Active** |
| `/dashboard/score-history` | `GET` | None | Bearer Token | Sub-chart component | Returns chronological score history timeline for user ideas. | **Verified Active** |
| `/dashboard/classification-counts` | `GET` | None | Bearer Token | Category pie chart | Returns category breakdown counts (`highlyPromising`, `promising`, etc.). | **Verified Active** |
| `/dashboard/recent` | `GET` | None | Bearer Token | Recent activity list | Returns up to 10 latest completed idea evaluations. | **Verified Active** |

---

### Multi-Idea Comparison Endpoints (`app/api/comparisons.py`)

| Endpoint Path | HTTP Method | Request Body / Params | Auth Required | Calling File & Function | Purpose & Response Format | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/comparisons` & `/ideas/compare` | `POST` | `CompareRequest`: `{ ideaIds: [id1, id2, ...] }` | Bearer Token | `frontend/src/services/api.ts:329` (`api.compareIdeas`) | Validates 2 to 4 ideas, returns 7-parameter radar coordinates + Gemini/heuristic synthesis. | **Verified Active** |
| `/comparisons/{idea_ids_slug}` | `GET` | Path: `idea_ids_slug` (e.g. `1,2,3`) | Bearer Token | URL shareable link | Executes comparison based on comma-separated slug of idea IDs. | **Verified Active** |

---

### Admin Observability & Governance (`app/api/admin.py`)

| Endpoint Path | HTTP Method | Request Body / Params | Auth Required | Calling File & Function | Purpose & Response Format | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/admin/metrics` | `GET` | None | Admin Bearer (`require_admin`) | System observability | Telemetry: avg duration (ms), slowest layer, LLM fallback rate, cache hit/miss stats. | **Verified Active** |
| `/admin/dashboard` | `GET` | None | Admin Bearer (`require_admin`) | `frontend/src/services/api.ts:418` (`api.getAdminDashboardStats`) | Institution metrics: total users, ideas, validations, daily active growth, score distribution. | **Verified Active** |
| `/admin/users` | `GET` | Query: `search?`, `provider?`, `sort?` | Admin Bearer (`require_admin`) | `frontend/src/services/api.ts:425` (`api.getAdminUsers`) | Lists all registered founders with collegiate affiliations, ideas count, validation counts. | **Verified Active** |
| `/admin/users/{user_id}` | `GET` | Path: `user_id` (int) | Admin Bearer (`require_admin`) | `frontend/src/services/api.ts:441` (`api.getAdminUserDetails`) | Detailed founder audit: account info, aggregate statistics, and list of owned venture ideas. | **Verified Active** |
| `/admin/ideas` | `GET` | Query: `search?`, `category?`, `sort?` | Admin Bearer (`require_admin`) | `frontend/src/services/api.ts:448` (`api.getAdminIdeas`) | Lists all ideas across the platform with owner details and latest report score. | **Verified Active** |
| `/admin/reports` | `GET` | Query: `search?`, `category?`, `sort?` | Admin Bearer (`require_admin`) | `frontend/src/services/api.ts:464` (`api.getAdminReports`) | Lists all validation reports across the platform with founder info and scores. | **Verified Active** |

---

### System Health Endpoint (`app/main.py:158`)

| Endpoint Path | HTTP Method | Request Body / Params | Auth Required | Purpose & Response Format | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/health` | `GET` | None | None | Deep health check: checks Database (`SELECT 1`), Redis `PING`, and LLM API reachability. Returns `{ status: "ok", db: "ok", redis: "ok", llm_api: "reachable" }`. | **Verified Active** |

---

## 3. Discrepancy & Incomplete Integrations Audit

1. **RAG Service Retrieval Endpoint (`rag_service.py`)**:
   - `RAGService.retrieve_relevant_documents` is initialized with `enabled=False` and returns `[]`. No real vector database (like Chroma or Pinecone) or external document store is connected.
2. **Google ID Token Signature Cryptographic Verification**:
   - In `backend/app/api/auth.py:176`, Google OAuth credential decoding uses `jwt.get_unverified_claims(payload.credential)` instead of validating against Google's public JWKS keys (`https://www.googleapis.com/oauth2/v3/certs`).
3. **Webhook Security**:
   - Outbound webhooks in `tasks.py:77-90` do not compute an HMAC-SHA256 signature in the header (e.g. `X-CheckStart-Signature`), meaning receiving webhook consumers cannot verify authenticity.
