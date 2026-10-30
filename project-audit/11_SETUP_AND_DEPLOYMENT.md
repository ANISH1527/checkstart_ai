# 11. Execution & Deployment Guide

This guide provides step-by-step instructions for running CheckStart AI from a clean environment in both local development mode and containerized production mode.

---

## 1. System Prerequisites

| Component | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Python** | `3.10.0` | `3.10.x` or `3.11.x` | `python --version` |
| **Node.js** | `18.0.0` | `20.x LTS` | `node -v` |
| **npm** | `9.0.0` | `10.x` | `npm -v` |
| **Git** | `2.30.0` | Latest | `git --version` |
| **Docker & Docker Compose** (Optional for dev, required for prod) | `20.10+` / `v2.0+` | Latest | `docker compose version` |
| **Redis** (Optional for dev, required for Celery/Cache) | `6.2+` | `7.x Alpine` | `redis-cli ping` |

---

## 2. Local Development Setup (Step-by-Step)

### Step 1: Clone Repository
```bash
git clone <repository_url> checkstart-ai
cd checkstart-ai
```

### Step 2: Backend Environment Configuration
Navigate to the `backend/` directory and create the `.env` configuration file:
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with safe development values:
```env
# Database (SQLite default for rapid local development)
DATABASE_URL=sqlite:///./startup_validation.db
TEST_DATABASE_URL=sqlite:///./test.db

# In-memory Redis default
REDIS_URL=redis://localhost:6379/0

# LLM Configuration (Set to 'mock' for zero-cost offline testing, or 'gemini' with valid key)
LLM_PROVIDER=mock
GEMINI_API_KEY=your_gemini_api_key_here

# Security
JWT_SECRET_KEY=change-this-to-a-secure-32-character-random-string-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ENVIRONMENT=development
LOG_LEVEL=INFO
```

### Step 3: Install Backend Dependencies
Create a Python virtual environment and install packages:
```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Run Database Migrations
Apply Alembic migrations to generate all 15 relational tables:
```bash
alembic upgrade head
```

### Step 5: Start the Backend Server
Launch the FastAPI ASGI application with live reloading:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Root: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- Deep Health Check: `http://127.0.0.1:8000/health`

### Step 6: Start Celery Worker (Optional for Dev, Required for Background Jobs)
If Redis is running locally:
```bash
# Windows
celery -A app.core.celery_app.celery_app worker --loglevel=info -P solo

# Linux / macOS
celery -A app.core.celery_app.celery_app worker --loglevel=info
```

### Step 7: Frontend Environment Configuration
In a new terminal window, navigate to `frontend/`:
```bash
cd ../frontend
cp .env.example .env
```

Ensure `frontend/.env` contains:
```env
VITE_API_URL=/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### Step 8: Install Frontend Dependencies & Start Dev Server
```bash
npm install
npm run dev
```
- Frontend Application URL: `http://localhost:5173`
- The Vite proxy automatically routes any `/api/...` requests to `http://localhost:8000`.

---

## 3. Production Deployment Guide (Docker Compose)

The repository provides a production-ready `backend/docker-compose.yml` orchestrating PostgreSQL, Redis, and FastAPI.

### Step 1: Configure Production Environment
Create `backend/.env` with production credentials:
```env
DATABASE_URL=postgresql://startup_user:SuperSecretPassword123@postgres:5432/startup_prod_db
REDIS_URL=redis://redis:6379/0
LLM_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyD...RealGoogleStudioKey
JWT_SECRET_KEY=9f83b2a1c0d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0
ENVIRONMENT=production
LOG_LEVEL=INFO
```

### Step 2: Build & Launch Containers
```bash
cd backend
docker compose up -d --build
```

### Step 3: Verify Container Health
```bash
docker compose ps
```
All services (`postgres`, `redis`, and `app`) must display status `healthy` or `running`.

### Step 4: Run Migrations Inside Container
```bash
docker compose exec app alembic upgrade head
```

### Step 5: Build Production Frontend Assets
On the host or inside a CI/CD pipeline:
```bash
cd ../frontend
npm run build
```
The compiled SPA will be output to `frontend/dist/` and can be served via Nginx, Cloudflare Pages, AWS S3 + CloudFront, or Vercel.

---

## 4. Required Ports & Service Dependencies

| Port | Service | Protocol | Access Level | Description |
| :--- | :--- | :--- | :--- | :--- |
| **8000** | FastAPI Backend | HTTP / REST | Public / Reverse Proxy | Primary API and Swagger docs |
| **5173** | Vite Dev Server | HTTP / WebSockets | Localhost | Frontend development server with HMR |
| **5432** | PostgreSQL Database | TCP / PostgreSQL Wire | Internal VPC only | Relational database storage |
| **6379** | Redis In-Memory Store | TCP / RESP | Internal VPC only | Embedding cache & Celery queue broker |

---

## 5. Troubleshooting & Common Errors

### 1. `Mock LLM not allowed in production`
- **Symptom**: App crashes on boot with `ValueError: Mock LLM not allowed in production`.
- **Cause**: In `backend/app/core/config.py:44`, a model validator forbids `LLM_PROVIDER=mock` when `ENVIRONMENT=production`.
- **Solution**: Set `LLM_PROVIDER=gemini` and provide a valid `GEMINI_API_KEY` in production `.env`.

### 2. Vite Proxy Error: `ECONNREFUSED 127.0.0.1:8000`
- **Symptom**: Frontend shows "Network Error" or 504 Gateway Timeout.
- **Cause**: The FastAPI backend server is not running on port 8000.
- **Solution**: Start Uvicorn (`uvicorn app.main:app --port 8000`) before running the frontend.

### 3. SentenceTransformers / PyTorch Torch Not Loaded
- **Symptom**: Warning logged: `Could not load SentenceTransformer (...). Using mock embedding fallback.`
- **Cause**: Host machine lacks compiled C++ runtime or PyTorch dependencies.
- **Solution**: The system automatically and gracefully activates `MockProvider` pseudo-embeddings. To enable real embeddings, run `pip install torch sentence-transformers`.

### 4. Celery Worker Fails on Windows: `PermissionError / WinError 5`
- **Symptom**: Celery worker crashes immediately on Windows when launched.
- **Cause**: Celery default prefork pool does not support Windows process spawning.
- **Solution**: Always add `-P solo` or `-P threads` on Windows: `celery -A app.core.celery_app.celery_app worker -P solo --loglevel=info`.
