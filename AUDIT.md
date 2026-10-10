# Comprehensive System Audit & Integration Specification

**CheckStart AI / AI Startup Validator**  
FastAPI Backend & React Frontend Integration Audit

---

## 1. Frontend Pages & Data Usage Audit

| Frontend Route | Component File | Current Calls / Data Source | Data Shape & Fields Used | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/dashboard` | `DashboardPage.tsx` | `api.getDashboardStats()` (`/api/ideas/dashboard/stats`) | `{ stats: { totalIdeas, totalValidations, activeConversations, averageScore, highestScore, categories: { highlyPromising, promising, needsImprovement, highRisk }, scoreHistory: [...], recentAnalyses: [...] } }` | **Missing on Backend** |
| `/validate` | `NewValidationPage.tsx` | `api.getConversations()`, `api.createConversation()`, `api.getConversation()`, `api.sendMessage()`, `api.validateConversation()`, `api.deleteConversation()` | `{ conversations: [...] }`, `{ message, structuredData }`, `{ reportId, versionNumber, overallScore, validationCategory }` | **Missing on Backend** (Chatbot engine completely absent) |
| `/ideas` | `MyIdeasPage.tsx` | `api.getIdeas({ search, category, sort })`, `api.deleteIdea()`, `api.getIdeaReports(id)` | `{ ideas: [...], count }` with `latestReport`, `reportsCount`, `conversationId`; `{ reports: VersionReportItem[] }` | **Partial on Backend** (Backend `/ideas` lacks search/category filters, reportsCount, latestReport; `/ideas/{id}/reports` missing) |
| `/compare` | `CompareIdeasPage.tsx` | `api.getIdeas()`, `api.compareIdeas(ideaIds)` (`/api/ideas/compare`) | Compares 2–4 distinct startup ideas; requires radar chart data, multi-idea parameter matrix, and comparative AI synthesis | **Missing on Backend** (Backend only has 1-idea version diff) |
| `/report/:id` | `ReportResultPage.tsx` | `api.getReport(id)` (`/api/validation/{id}`), `api.getIdeaReports(ideaId)` | Full report: `scores`, `overallScore`, `validationPercentage`, `validationCategory`, `summary`, `analysis: { strengths, weaknesses, marketAnalysis, competitionAnalysis, ... }` | **Mismatched on Backend** (Backend only looks up by `idea_id` + version, lacks direct `report_id` endpoint) |
| `/profile` | `ProfilePage.tsx` | `api.updateProfile()` (`/api/user/profile`) | `{ user: { name, college, course, graduationYear, email, authProvider } }` | **Missing on Backend** (User model missing student fields) |
| `/settings` | `SettingsPage.tsx` | `api.updatePassword()`, `api.verifyDeleteIdentity()`, `api.deleteAccount()` | Password update; identity verification via Google credential or password; permanent account deletion | **Missing on Backend** |
| `/login`, `/register` | `LoginPage.tsx`, `RegisterPage.tsx` | `api.login()`, `api.register()`, `api.googleAuth()`, `api.getMe()` | `{ token, user: User }` | **Partial on Backend** (Backend login requires OAuth2 form data; Google auth absent) |

---

## 2. Backend Endpoints & Schemas Audit

| Method | Endpoint | Description | Request Schema | Response Schema | Status / Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new user | `UserRegister(name, email, password)` | `SuccessResponse(UserResponse)` | Does not return token directly; frontend expects `{ token, user }` |
| `POST` | `/api/v1/auth/login` | Login user | `OAuth2PasswordRequestForm` (form-data) | `SuccessResponse({ access_token, token_type })` | Requires `application/x-www-form-urlencoded`; lacks user object in payload |
| `GET` | `/api/v1/auth/me` | Current user info | Bearer token | `SuccessResponse(UserResponse)` | Returns basic user (id, name, email, role) |
| `POST` | `/api/v1/ideas` | Create startup idea | `IdeaCreate` | `SuccessResponse(IdeaResponse)` | Working |
| `GET` | `/api/v1/ideas` | List user ideas | Query params: `limit`, `offset`, `classification`, `sort_by` | `SuccessResponse({ items, total })` | Lacks search query and category filtering; items missing `latestReport` and `reportsCount` |
| `GET` | `/api/v1/ideas/{id}` | Get idea details | ID | `SuccessResponse(IdeaResponse)` | Working |
| `PUT` | `/api/v1/ideas/{id}` | Update idea | `IdeaUpdate` | `SuccessResponse(IdeaResponse)` | Working |
| `DELETE`| `/api/v1/ideas/{id}` | Soft/hard delete | ID, `hard` flag | 204 No Content | Working |
| `POST` | `/api/v1/ideas/{id}/validate` | Run validation task | Idea ID | `SuccessResponse({ job_id, status })` | Async Celery job; on-demand execution available |
| `GET` | `/api/v1/ideas/{id}/validation` | Get validation report | Idea ID, optional `version` | `SuccessResponse(ValidationResponse)` | Requires `idea_id`; does not allow lookup by `report_id` |
| `GET` | `/api/v1/ideas/{id}/comparison` | Single-idea version diff | Idea ID, `v1`, `v2` | `SuccessResponse(comparison_data)` | Compares two versions of the same idea only |
| `GET` | `/api/v1/ideas/{id}/history` | List idea validation versions | Idea ID | `SuccessResponse({ items: [...] })` | Missing score delta and detailed parameter map |
| `GET` | `/api/v1/reports/{id}/markdown` | Export markdown report | Idea ID | PlainText Markdown | Working |
| `GET` | `/api/v1/admin/metrics` | Pipeline telemetry | Admin Bearer | `SuccessResponse(metrics)` | Working for admin observability |

---

## 3. Gap Matrix

| Area | Status | Gap Description | Resolution |
| :--- | :--- | :--- | :--- |
| **Conversational Chatbot** | **MISSING** | Backend has no conversational sessions, messages, or validation assistant logic. | Implement `ValidationSession` and `ConversationMessage` models, `ChatService` with rolling context, Layer 1–2 extraction, dynamic follow-ups, and `/sessions` + `/conversations` endpoints. |
| **Scoring Parameters** | **MISMATCHED** | Backend evaluates 9 weighted parameters (25, 20, 10, 10, 10, 10, 10, 3, 2); Frontend displays 7 parameters. | Backend keeps authoritative 9-parameter engine and outputs both 9-dimension specifics and unified 7-parameter rollup under Framework `v1.0`. Overall score computed strictly in code. |
| **Classification Bands** | **MISMATCHED** | Backend uses 5 bands (`EXCEPTIONAL`, `STRONG`, `MODERATE`, `WEAK`, `VERY_WEAK`); Frontend displays 4 badges (`Highly Promising`, `Promising`, `Needs Improvement`, `High Risk`). | Unify into one authoritative `classify_score()` with boundary rules, returning both stable code and display label. |
| **Idea vs Report Versioning** | **MISMATCHED** | `Idea` table carries `version`; report table `validation_results` also carries `version`. | Decouple versioning so version belongs exclusively to the immutable report `(idea_id, version)`. Allocate version transactionally. |
| **Dashboard Metrics** | **MISSING** | No `/dashboard/stats` endpoint returning aggregated founder metrics, category counts, or timeline. | Implement `/dashboard/stats` and `/ideas/dashboard/stats` aggregating real records from DB (latest completed report per idea). |
| **Multi-Idea Comparison** | **MISSING** | Backend only supports single-idea version comparisons; cannot compare 2–4 distinct ideas. | Implement `POST /comparisons` & `POST /ideas/compare` supporting 2–4 owned ideas with multi-axis radar coordinates and schema-validated LLM synthesis. |
| **Profile & Settings** | **MISSING** | User model lacks collegiate fields (`college`, `course`, `graduation_year`); no theme sync or password/account management. | Add `UserProfile`, `UserPreference` models; implement `/profile`, `/settings`, password change, identity verification, and account deletion. |
| **Google Authentication** | **MISSING** | Frontend supports Google GIS tokens; Backend only supports email/password local auth. | Implement `POST /api/v1/auth/google`, verify GIS tokens, store `google_sub`, and identify users securely. |
| **API Path & Response Envelopes** | **MISMATCHED** | Frontend calls `/api/...` expecting unwrapped JSON; Backend serves `/api/v1/...` wrapping in `{ success, data }`. | Frontend API client normalizes responses (`data` unwrap), attaches auth headers, handles 401s, and proxies to `/api/v1`. Backend routes support both paths. |

---

## 4. Decision Table

| Feature / Area | Frontend Has | Backend Has | Winner | Action | Size of Frontend Change |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Scoring Engine** | 7 display parameters | 9-layer weighted engine (sum 100) + confidence | **Backend** | Keep backend 9-dimension scoring engine; provide versioned Framework `v1.0` with 7-parameter aggregation for existing UI cards & radar. | **None** |
| **Classification** | 4 display badges | 5 granular bands | **Backend** | Keep backend 5-band thresholding; map cleanly to display labels (`EXCEPTIONAL` &rarr; Highly Promising, `STRONG` &rarr; Promising, `MODERATE` &rarr; Moderate, `WEAK` &rarr; Needs Improvement, `VERY_WEAK` &rarr; High Risk). | **Slight** (Support 5th badge color/label in `StatusBadge`) |
| **Conversational Validation** | Interactive chat UI with follow-ups & report triggers | None | **Frontend** (UI) + **Backend** (New Engine) | Build complete `ChatService` on backend supporting sessions, rolling history, extraction, and validation trigger. Connect chat UI to real endpoints. | **Slight** (API client wiring, safe Markdown rendering) |
| **Idea Versioning** | Displays report versions `v1`, `v2` with delta | Stores version on both `Idea` and `ValidationResult` | **Backend** | Store version exclusively on `ValidationResult` (`UNIQUE(idea_id, version)`); allocate transactionally; store `inputs_changed`. | **None** |
| **Multi-Idea Comparison** | 2–4 idea selector with radar chart & matrix | Single-idea version diff | **Frontend** (Requirement) | Implement `POST /comparisons` on backend for 2–4 ideas; matrix and scores derived purely from stored reports; LLM used only for synthesis. | **Slight** (API client wiring) |
| **Authentication** | Google GIS button + fallback chooser | Email/password + JWT | **Both** | Support both; make Google GIS primary with `google_sub` tracking; keep local email/password login. Payload decoding fallback restricted strictly to `ENV=development`. | **None** |
| **Founder Profile & Preferences** | College, course, graduation year, dark/light theme | Basic user table (name, email, role) | **Frontend** | Add `UserProfile` and `UserPreference` tables and endpoints (`/profile`, `/settings`); persist theme on server. | **Slight** (Theme synced to server on toggle) |
| **Report Export & Sharing** | Client-side jsPDF download | Backend Markdown export & public share capabilities | **Backend** | Keep both. Provide markdown report endpoint and expose shareable link. | **None** |

---

## 5. Security, Inconsistencies & Bug Audit

1. **Authentication IDOR Vulnerabilities**: All private endpoints must verify ownership using the authenticated user ID extracted from JWT (`current_user.id`). Any attempt to read or modify another user's idea, session, or report will return 404 or 403.
2. **Google GIS Token Forgery**: The previous mock fallback decoded token payloads without cryptographic signature verification. In production, this allows token spoofing. **Fix**: Signature verification using Google certs, with non-verifying fallback permitted strictly when `ENVIRONMENT == "development"`.
3. **Raw Markdown Display Bug in Chat**: The chat interface renders raw Markdown as text, causing unrendered `**` and `*` characters to appear. **Fix**: Sanitize and render clean Markdown safely in the chat bubble component.
4. **Idempotency in Chat & Validation**: Duplicate message submissions could result in duplicated assistant turns. **Fix**: Implement `client_message_id` unique constraint per session so duplicate messages return the already-generated assistant turn. Similarly, `Idempotency-Key` on `/validate` prevents duplicate report generation.
5. **Prompt Injection Guardrails**: User input is treated strictly as data, never as system instructions. Chat assistant prompts instruct the model never to reveal system instructions or medical/legal/financial guarantees.
