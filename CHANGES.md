# AI Validate Frontend & Backend Integration Changes

This document details all slight frontend adjustments and backend additions made to connect the React + Vite frontend to the FastAPI backend and integrate the Conversational Validation / AI Chatbot feature.

---

## Decision Rule Applied
- **Backend Stronger**: The backend 9-parameter engine (`sum(score * weight) / 100`), classification bands, and relational SQLite schema were preserved as authoritative. The frontend was adapted to consume aggregated 7-parameter rollups alongside detailed backend scores without altering visual layouts, component hierarchy, or page routes.
- **Frontend Stronger / Backend Missing**: The backend lacked conversational validation sessions, message history, user preferences, academic profiles, direct validation report retrieval, and comparison endpoints. The backend was extended to fully support the frontend's contracts.

---

## 1. Frontend Modifications

### A. Safe Markdown Message Rendering (`src/components/SafeMarkdown.tsx` & `src/pages/NewValidationPage.tsx`)
- **Problem**: AI Chatbot responses containing Markdown formatting (e.g., `**Market Demand**`, `- Bullet points`) were rendered as raw asterisks and dashes inside `whitespace-pre-wrap` containers.
- **Change**: Created `SafeMarkdown` component that safely parses headings, bold/italic typography, inline code, and bullet/numbered lists into native React elements without external dependencies or `dangerouslySetInnerHTML`.
- **Impact**: Clean, styled conversational interface with zero XSS vulnerabilities.

### B. API Client Envelope & Error Unwrapping (`src/services/api.ts`)
- **Problem**: Backend wraps responses in standard `{ success: true, data: { ... } }` envelopes, while frontend components expect unwrapped model objects (e.g. `{ conversations: [...] }`). HTTP 204 No Content responses also caused JSON parse errors.
- **Change**:
  - Configured `API_BASE = import.meta.env.VITE_API_URL || '/api'`.
  - Added HTTP 204 handler returning `{ message: 'Success' }`.
  - Added automatic unwrapping of `{ success: true, data: T }` to return `data`.
  - Added robust error message extraction prioritizing `data.message`, `data.detail`, or `data.error`.
  - Added automatic local token cleanup upon HTTP 401 Unauthorized responses.
  - Added `getSettings()` and `updateSettings()` API methods.

### C. Theme Preference Persistence (`src/contexts/ThemeContext.tsx`)
- **Problem**: Theme toggles (light/dark mode) were only saved in browser `localStorage` and did not sync across devices or user sessions.
- **Change**: Connected `ThemeProvider` to sync theme state to the backend (`PUT /settings`) when authenticated, and hydrate saved preferences on login (`GET /settings`).

---

## 2. Backend Additions

### A. Conversational Validation & Chatbot Engine (`ChatService` & `/sessions`)
- **Models**: Created `ValidationSession` and `ConversationMessage` with foreign keys, indexes, and unique client idempotency constraint (`uq_session_client_message_id`).
- **Endpoints**:
  - `GET /sessions` and `GET /conversations`: Paginated list of user chat sessions.
  - `POST /sessions` and `POST /conversations`: Start new validation session.
  - `GET /sessions/{id}` and `GET /conversations/{id}`: Detailed session state and messages.
  - `POST /sessions/{id}/messages` and `POST /conversations/{id}/messages`: Bi-directional dialogue with structured entity extraction and completeness scoring.
  - `POST /sessions/{id}/validate` and `POST /conversations/{id}/validate`: Triggers pipeline validation directly from chat context.
  - `DELETE /sessions/{id}` and `DELETE /conversations/{id}`: Soft delete conversation.

### B. Multi-Idea Comparison Engine (`/comparisons` & `/ideas/compare`)
- **Endpoints**: `POST /comparisons` and `POST /ideas/compare`
- **Validation**: Enforces 2–4 distinct owned startup ideas, ensures each idea has an existing completed validation report on framework `v1.0`.
- **Output**: Generates radar comparison matrix and LLM/heuristic synthesis with required decision-support disclaimer.

### C. User Profiles, Academic Credentials & Preferences (`/profile` & `/settings`)
- **Models**: Created `UserProfile` (college, course, graduation year) and `UserPreference` (theme, email notifications).
- **Endpoints**:
  - `GET/PUT /user/profile` and `GET/PUT /profile`
  - `GET/PUT /user/settings` and `GET/PUT /settings`
  - `PUT /user/password`
  - `POST /user/verify-delete` and `DELETE /user/account`

### D. Authentication Extensions (`/auth`)
- **Endpoints**:
  - Extended `/auth/register` and `/auth/login` to return `{ token, user, message }` alongside standard JWT envelopes.
  - Added `POST /auth/google` with Google GIS token verification and dev fallback.
  - Added `POST /auth/admin/login` enforcing admin role verification.
  - Added `POST /auth/forgot-password` and `POST /auth/reset-password`.

### E. Authoritative Scoring & Dual Rollups (`ScoringService`)
- Authoritative 9-dimension weighted engine with `FRAMEWORK_VERSION = "v1.0"`.
- Added `aggregate_to_7_parameters` rollup returning the 7 frontend parameters scaled from 1.0 to 10.0.
- Unified 5-band classification (`EXCEPTIONAL`, `STRONG`, `MODERATE`, `WEAK`, `VERY_WEAK`) mapped to stable display labels (`Highly Promising`, `Promising`, `Moderate`, `Needs Improvement`, `High Risk`).
