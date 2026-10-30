# CheckStart AI — Automated CI/CD Deployment & Production Pipeline Guide

This guide provides end-to-end instructions for the continuous integration, continuous delivery (CI/CD), and automated deployment pipeline for **CheckStart AI**.

---

## 1. Pipeline Architecture Overview

```
                                      +------------------------------------+
                                      |         Developer Machine          |
                                      |      (Google Antigravity IDE)      |
                                      +-----------------+------------------+
                                                        |
                                                        | git push origin main
                                                        v
                                      +------------------------------------+
                                      |          GitHub Repository         |
                                      |  (ANISH1527/checkstart_ai: main)   |
                                      +-----------------+------------------+
                                                        |
                                 +----------------------+----------------------+
                                 |                                             |
                                 v                                             v
               +-----------------------------------+         +-----------------------------------+
               |  GitHub Actions: Frontend Job     |         |  GitHub Actions: Backend Job      |
               |  - Node 20 Setup & npm ci         |         |  - Python 3.11 Setup & Pip Cache  |
               |  - Vitest Unit Tests (75 passed)  |         |  - Production Imports Verification|
               |  - TypeScript Verification & Vite |         |  - Pytest Scoring & Rules Tests   |
               +-----------------+-----------------+         +-----------------+-----------------+
                                 |                                             |
                                 +----------------------+----------------------+
                                                        |
                                            All Checks Passed (Green)
                                 (If ANY check fails: Deployment is Blocked)
                                                        |
                         +------------------------------+------------------------------+
                         |                                                             |
                         v                                                             v
        +----------------------------------+                         +----------------------------------+
        |         Vercel Deployment        |                         |         Render Deployment        |
        |  - Root: /frontend               |                         |  - Blueprint: render.yaml        |
        |  - Host: Edge CDN                |                         |  - Root: /backend                |
        |  - Env: VITE_API_URL             |                         |  - Zero-Downtime Deploy          |
        +----------------+-----------------+                         +----------------+-----------------+
                         |                                                             |
                         +------------------------------+------------------------------+
                                                        |
                                                        v
                                      +------------------------------------+
                                      |     Live Smoke & Health Checks     |
                                      |  - Frontend: HTTP 200 Root HTML    |
                                      |  - Backend: /health (DB, LLM, Mem) |
                                      |  - CORS: Cross-origin Headers      |
                                      +------------------------------------+
```

---

## 2. Database Connectivity: Relational ORM & Production Strategy

### Codebase Architecture Reality
The CheckStart AI backend is built on **SQLAlchemy ORM 2.0** and **Alembic** migrations. Its relational data models (`users`, `ideas`, `validations`, `scores`, `competitors`, `recommendations`, `report_analyses`, `chat_sessions`, `chat_messages`) require a **relational database engine** (PostgreSQL in production, SQLite in local development).

### Connecting Production Database:
1. **Render Native PostgreSQL (Recommended & Automated via `render.yaml`):**
   - The root [`render.yaml`](../render.yaml) automatically provisions a managed PostgreSQL database instance (`checkstart-db`) and injects `DATABASE_URL` directly into the backend service.
   - Driver used: `psycopg2-binary` (pre-installed and verified in `requirements.txt`).
2. **MongoDB Atlas Consideration:**
   - MongoDB Atlas is a NoSQL document database (`mongodb+srv://`). Supplying a raw MongoDB URI to SQLAlchemy ORM's engine will raise a dialect error (`ArgumentError: Could not parse rfc1738 for string 'mongodb+srv://'`).
   - If you wish to use MongoDB Atlas for auxiliary document logging, raw prompt caching, or vector archiving, configure `MONGODB_URI` as a complementary service. However, the core relational entities of CheckStart AI persist via PostgreSQL to maintain referential integrity without modifying application features.

---

## 3. Environment Variables & Secret Configuration

### Backend Production Variables (Configure in Render Dashboard)
| Variable | Value / Description | Sensitive? |
| :--- | :--- | :--- |
| `ENVIRONMENT` | `production` | No |
| `DEBUG` | `false` | No |
| `PYTHON_VERSION` | `3.11.9` | No |
| `API_V1_STR` | `/api/v1` | No |
| `DATABASE_URL` | Auto-populated by Render PostgreSQL (`checkstart-db`) or Supabase URI | **Yes** |
| `JWT_SECRET_KEY` | Render auto-generates 64-char key (or generate via `openssl rand -hex 32`) | **Yes** |
| `JWT_ALGORITHM` | `HS256` | No |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` (7 days) | No |
| `LLM_PROVIDER` | `gemini` | No |
| `GEMINI_API_KEY` | Your Google Gemini API Key from Google AI Studio | **Yes** |
| `CORS_ORIGINS` | Your Vercel frontend URL, e.g. `https://checkstart-ai.vercel.app` | No |
| `CELERY_TASK_ALWAYS_EAGER` | `1` | No |
| `REDIS_REQUIRED` | `false` (in-memory execution unless Redis add-on attached) | No |

### Frontend Production Variables (Configure in Vercel Dashboard)
| Variable | Value / Description | Sensitive? |
| :--- | :--- | :--- |
| `VITE_API_URL` | Render backend URL pointing to `/api`, e.g. `https://checkstart-ai-backend.onrender.com/api` | No |

### GitHub Actions Secrets (Configure in GitHub Repo -> Settings -> Secrets and variables -> Actions)
| Secret Name | Purpose |
| :--- | :--- |
| `RENDER_DEPLOY_HOOK_URL` | Render Webhook URL to trigger gated deployment only after tests pass. |
| `VERCEL_DEPLOY_HOOK_URL` | Optional Vercel Deploy Hook URL (if using webhook-based deployment). |
| `BACKEND_URL` | Production Render URL (e.g. `https://checkstart-ai-backend.onrender.com`) for post-deployment health check. |
| `FRONTEND_URL` | Production Vercel URL (e.g. `https://checkstart-ai.vercel.app`) for post-deployment smoke check. |

---

## 4. Step-by-Step Setup Requiring User Manual Authorization

Due to security boundaries, OAuth scopes, and external platform accounts, the following manual steps require your direct authorization:

### Step 1: Connect Project to GitHub
The workspace is already initialized with remote `https://github.com/ANISH1527/checkstart_ai.git`.
Ensure your production branch is `main`:
```bash
git push -u origin main
```

### Step 2: Configure Render for Backend Hosting
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository: `ANISH1527/checkstart_ai`.
4. Render detects [`render.yaml`](../render.yaml) at the repository root:
   - Web Service: `checkstart-ai-backend` (Environment: Python 3.11, Root Directory: `backend`).
   - PostgreSQL Database: `checkstart-db`.
5. Under Environment Variables for `checkstart-ai-backend`:
   - Enter your `GEMINI_API_KEY`.
   - Set `CORS_ORIGINS` to `https://<your-vercel-app>.vercel.app`.
6. Click **Apply**.
7. *(Optional for strict gating)* In Render Web Service Settings:
   - Turn **Auto-Deploy** to `No`.
   - Scroll to **Deploy Hook** -> click **Create Deploy Hook**.
   - Copy the Deploy Hook URL and save it in your GitHub Secrets as `RENDER_DEPLOY_HOOK_URL`.

### Step 3: Configure Vercel for Frontend Hosting
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository: `ANISH1527/checkstart_ai`.
4. In the Project Configuration:
   - **Framework Preset**: Vite
   - **Root Directory**: Click *Edit* and select **`frontend`** (Important!).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**:
   - Add Key: `VITE_API_URL`
   - Value: `https://checkstart-ai-backend.onrender.com/api` (replace with your Render backend URL).
6. Click **Deploy**.

### Step 4: Configure GitHub Branch Protection (Prevent Broken Deployments)
To satisfy Requirement 9 ("Prevent deployment when critical build checks fail"):
1. In your GitHub repository, navigate to **Settings** -> **Branches**.
2. Click **Add branch ruleset** or **Add branch protection rule**.
3. Branch name pattern: `main`.
4. Check **Require status checks to pass before merging**:
   - Search and select:
     - `Verify Frontend (Typecheck, Build & Tests)`
     - `Verify Backend (Dependencies, Syntax & Unit Tests)`
5. Check **Require branches to be up to date before merging**.
6. Click **Save Changes**.

---

## 5. Deployment Health Verification

You can verify your live deployment at any time using the included script:
```bash
python scripts/verify_deployment.py --backend-url https://checkstart-ai-backend.onrender.com --frontend-url https://checkstart-ai.vercel.app
```

The script verifies:
- `[BACKEND]` `/health` endpoint returning HTTP 200 with `status: ok` and database connection `db: ok`.
- `[DOCS]` FastAPI Swagger UI accessibility at `/docs`.
- `[FRONTEND]` React SPA root bundle loading without network failures.
- `[CORS]` Preflight OPTIONS request verification from your Vercel origin.

---

## 6. Rollback Instructions

If an unexpected runtime regression occurs in production:

### Frontend Rollback (Vercel)
1. Go to **Vercel Dashboard** -> select project `ai-startup-validator-frontend`.
2. Navigate to the **Deployments** tab.
3. Find the last known working deployment.
4. Click the **three dots (...)** menu on the right of that deployment.
5. Click **Instant Rollback** (or **Promote to Production**).
   - Vercel instantly switches DNS traffic to the previous build in < 5 seconds with zero build delay.

### Backend Rollback (Render)
1. Go to **Render Dashboard** -> select service `checkstart-ai-backend`.
2. Click the **Events** or **Deploys** tab in the left navigation.
3. Locate the previous successful deploy.
4. Click the **three dots (...)** menu -> click **Rollback to this deploy**.
   - Render will immediately spin up the previous container revision and safely switch traffic once the health check (`/health`) passes.

### Git Production Branch Rollback (Permanent Code Fix)
```bash
# Revert the faulty commit on main
git checkout main
git pull origin main
git revert HEAD --no-edit
git push origin main
```
This triggers the CI/CD pipeline, automatically validating and deploying the clean rollback state.
