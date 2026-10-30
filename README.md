# CheckStart AI 🚀
### AI-Assisted Startup Idea Validation and Strategic Recommendation Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**CheckStart AI** is an intelligent, evidence-aware startup idea validation system designed for founders, student entrepreneurs, and startup incubators. It combines conversational AI co-piloting, lightweight NLP entity extraction, deterministic multi-dimensional scoring, vector similarity benchmarking, confidence calibration, and actionable strategic recommendations.

Unlike generic LLM wrappers that output arbitrary scores, CheckStart AI uses an **authoritative 7-parameter mathematical scoring engine (`report_v1`)** calibrated with rule-based verification, Layer 8 claim taxonomy, information-gap detection, and multi-version tracking (`v1` → `v2`) with delta analysis. A 9-dimension framework (`legacy_v9`) is also preserved for historical backward compatibility.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Scoring & Calibration Methodology](#-scoring--calibration-methodology)
- [Project Structure](#-project-structure)
- [Technology Stack](#-technology-stack)
- [Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#1-prerequisites)
  - [Backend Setup](#2-backend-setup)
  - [Frontend Setup](#3-frontend-setup)
- [Configuration (.env)](#-configuration-env)
- [Running Automated Tests](#-running-automated-tests)
- [API Overview](#-api-overview)
- [Disclaimer](#-disclaimer)
- [License](#-license)

---

## ✨ Key Features

- **⚡ Instant Turn 1 Validation**: Submit a concept (e.g. *CampusConnect*) and immediately receive an initial validation report with overall score, classification, 7-parameter rollup, key strengths, weaknesses, and next-step actions without being trapped behind mandatory follow-up questions.
- **💬 Conversational AI Co-Pilot**: Multi-turn conversational interface powered by `ChatService`. Allows founders to incrementally supply competitor details, target audience personas, and monetization strategies.
- **🔄 Iterative Revalidation & Versioning**: Re-evaluate updated ideas with one click (`Recalculate Score`). Supports automatic version increments (`v1` → `v2`) and visual delta tracking (+0.4 score improvements).
- **📊 9-Dimension Scoring & 7-Parameter Viability Rollup**:
  - Deterministic evaluation of Market Demand, Problem-Solution Fit, Target Customer, Competition, Uniqueness, Feasibility, Business Model, Scalability, and Risk.
- **🛡️ Built-in Guardrails & Security**:
  - Prompt injection and jailbreak screening (`ignore instructions`, `reveal system prompt`).
  - Input vagueness detection with targeted clarification prompts (`MISSING_INFO`).
  - SlowAPI rate limiting (5 req/min on sensitive authentication endpoints).
  - Resilient graceful degradation mode (heuristic fallbacks when external LLM or Redis are unavailable).
- **📈 Interactive Reports & Export**: Detailed radar charts, risk assessment matrices, root-cause analyses, and one-click PDF report export.
- **⚖️ Multi-Idea Comparison**: Side-by-side comparative benchmarking for 2–4 owned startup ideas with ranked recommendations.
- **🔐 Complete Authentication & User Profiles**:
  - Email/Password JWT authentication with bcrypt hashing.
  - Google GIS SSO integration.
  - Admin observability portal with metrics dashboard.
  - Academic profiles (college, course, graduation year) and user theme persistence (Dark / Light mode).

---

## 🏛️ System Architecture

```text
┌────────────────────────────────────────────────────────┐
│               Frontend (React + Vite)                  │
│       Pages: Dashboard | Validate | Reports | Compare  │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / REST (/api)
                            ▼
┌────────────────────────────────────────────────────────┐
│           FastAPI Gateway (/api/v1 & /api)             │
│   Rate Limiter | Auth Middleware | Exception Handlers  │
└──────┬────────────────────┬────────────────────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Auth & Users │     │ Chat Service │     │ Idea Service │
│ (JWT/Bcrypt) │     │ (Sessions)   │     │ (CRUD/State) │
└──────────────┘     └──────┬───────┘     └──────┬───────┘
                            │                    │
                            ▼                    ▼
       ┌──────────────────────────────────────────────────┐
       │           Validation Pipeline Engine             │
       │  1. Prompt Injection & Length Sanitization       │
       │  2. NLP Entity & Context Extraction              │
       │  3. Semantic Similarity (MiniLM-L6-v2)           │
       │  4. Benchmark & Evidence Verification            │
       │  5. LLM Analysis (Gemini / Ollama / Mock)        │
       │  6. 9-Dimension Deterministic Scoring            │
       │  7. 7-Parameter Viability Rollup                 │
       │  8. Multi-Factor Confidence Calibration          │
       │  9. 15-Layer Recommendation Synthesis            │
       └────────────────────┬─────────────────────────────┘
                            │
                            ▼
       ┌──────────────────────────────────────────────────┐
       │   Persistence Layer (SQLAlchemy 2.0 + SQLite/PG) │
       │  Users | Ideas | ValidationResults | Sessions    │
       └──────────────────────────────────────────────────┘
```

---

## 📊 Scoring & Calibration Methodology

### 9-Dimension Authoritative Weights
Overall validation scores are computed deterministically (never directly hallucinated by LLMs) using normalized weights totaling 100%:

| Dimension | Weight | Focus Area |
| :--- | :---: | :--- |
| **Market Demand** | 25% | Problem urgency, addressable market size, willingness to pay |
| **Problem-Solution Fit** | 20% | Directness and efficacy of proposed solution vs pain point |
| **Target Customer** | 10% | Buyer persona specificity and accessibility |
| **Competition** | 10% | Saturation, moats, and differentiation against incumbents |
| **Uniqueness / Innovation**| 10% | Novelty of approach, IP, or workflow configuration |
| **Technical Feasibility** | 10% | Build complexity, technical hurdles, stack maturity |
| **Business Potential** | 10% | Unit economics, pricing model, gross margins |
| **Scalability** | 3% | Friction-free user and operational expansion |
| **Risk Level** | 2% | Execution, regulatory, platform dependency risks |

### 5-Band Unified Classification Tiers
- **90 – 100**: `EXCEPTIONAL` (*Highly Promising*)
- **75 – 89**: `STRONG` (*Promising*)
- **60 – 74**: `MODERATE` (*Moderate Viability*)
- **40 – 59**: `WEAK` (*Needs Improvement*)
- **0 – 39**: `VERY_WEAK` (*High Risk*)

### Multi-Factor Confidence Formula
$$\text{Confidence} = (0.30 \times \text{Completeness}) + (0.30 \times \text{Model Agreement}) + (0.25 \times \text{Evidence Quality}) + (0.15 \times \text{Rule Consistency})$$

---

## 📁 Project Structure

```text
checkstart-ai/
├── backend/                        # FastAPI Application
│   ├── alembic/                    # Database migration scripts
│   ├── app/
│   │   ├── api/                    # API Route controllers
│   │   │   ├── admin.py            # Admin observability endpoints
│   │   │   ├── auth.py             # Auth (Login, Register, Google SSO)
│   │   │   ├── comparisons.py      # Multi-idea comparison matrix
│   │   │   ├── dashboard.py        # Founder statistics and analytics
│   │   │   ├── ideas.py            # Idea management endpoints
│   │   │   ├── reports.py          # Interactive validation reports
│   │   │   ├── sessions.py         # Conversational chat sessions
│   │   │   └── validation.py       # Core validation trigger endpoints
│   │   ├── core/                   # Configuration, security, database
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   ├── repositories/           # Data access repository layer
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   ├── services/               # Core business logic
│   │   │   ├── chat_service.py     # Conversational validation co-pilot
│   │   │   ├── scoring_service.py  # 9-dim scoring & 7-param rollup
│   │   │   ├── validation_service.py# Multi-layer pipeline orchestrator
│   │   │   └── llm_providers/      # Gemini, Ollama, and Mock providers
│   │   └── tests/                  # Pytest test suite (67 passed tests)
│   ├── requirements.txt            # Python dependencies
│   ├── startup_validation.db       # Local SQLite database
│   └── Dockerfile                  # Backend container configuration
│
├── frontend/                       # React 18 + Vite SPA
│   ├── src/
│   │   ├── components/             # Reusable UI widgets
│   │   │   ├── ScoreGauge.tsx      # Circular SVG score gauge
│   │   │   ├── RadarChartWidget.tsx# 7-parameter radar chart
│   │   │   ├── ParameterProgress.tsx# Viability progress bars
│   │   │   └── SafeMarkdown.tsx    # Native sanitized Markdown renderer
│   │   ├── contexts/               # React Contexts (Auth, Theme)
│   │   ├── pages/                  # Route views
│   │   │   ├── DashboardPage.tsx   # Founder dashboard & analytics
│   │   │   ├── NewValidationPage.tsx# Instant chat & validation interface
│   │   │   ├── MyIdeasPage.tsx     # Startup venture history & search
│   │   │   ├── ReportResultPage.tsx# Full interactive validation report
│   │   │   ├── CompareIdeasPage.tsx# Multi-venture comparison matrix
│   │   │   └── LoginPage.tsx       # Authentication view
│   │   ├── services/api.ts         # Axios API client & endpoints
│   │   └── types/index.ts          # TypeScript type definitions
│   ├── package.json                # Frontend package configuration
│   └── vite.config.ts              # Vite build & proxy configuration
│
└── README.md                       # Project documentation
```

---

## 🛠️ Technology Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18 + TypeScript | Component-based, strictly-typed user interface |
| **Build Tool** | Vite 5 | Fast HMR dev server & optimized production bundling |
| **Styling** | Tailwind CSS + Lucide Icons | Responsive modern design with dynamic dark mode |
| **Backend** | FastAPI (Python 3.11+) | Asynchronous, OpenAPI-compliant high-performance web framework |
| **Database** | SQLAlchemy 2.0 + SQLite / PostgreSQL | Robust ORM with Alembic schema migrations |
| **Security** | JWT (PyJWT) + Passlib (Bcrypt) | Token-based auth with secure password hashing |
| **Rate Limiting** | SlowAPI | Leaky-bucket IP-based rate limiting on sensitive routes |
| **NLP & Vectors**| Sentence Transformers (`MiniLM-L6-v2`) | Local semantic vector embeddings and cosine similarity |
| **LLM Engine** | Google Gemini API / Heuristic Fallback | Multi-stage analysis with resilient local fallback engine |

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Python**: 3.11, 3.12, or 3.13 installed
- **Node.js**: v18.x or v20.x+ with `npm` installed
- **Git**

---

### 2. Backend Setup & Run Modes

#### Mode A: Standalone Development Mode (Default - SQLite, No Celery/Redis required)
This is the quickest way to get started. The system uses local SQLite (`startup_validation.db`) and in-memory caching/synchronous execution:

1. Navigate to the backend directory and activate the virtual environment:
   ```bash
   cd backend
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Ensure `.env` is configured (SQLite by default):
   ```bash
   cp .env.example .env
   ```

4. Run database migrations with Alembic:
   ```bash
   python -m alembic upgrade head
   ```

5. Launch the FastAPI server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

   The backend will be running at **http://127.0.0.1:8000**
   - Interactive Swagger API Documentation: **http://127.0.0.1:8000/docs**
   - ReDoc Documentation: **http://127.0.0.1:8000/redoc**

#### Mode B: Distributed Production Mode (Celery + Redis)
For asynchronous background task offloading and distributed worker queues:

1. Start a local Redis server instance:
   ```bash
   # Windows (via Docker or native service):
   docker run -d -p 6379:6379 --name checkstart-redis redis:7-alpine
   # Linux:
   sudo systemctl start redis-server
   ```

2. Start the Celery worker process:
   ```bash
   cd backend
   celery -A app.core.celery_app.celery_app worker --loglevel=info -P solo
   ```

3. Start the FastAPI application in a separate terminal:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

---

### 3. Frontend Setup

1. Open a terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open **http://localhost:5173** in your web browser.

---

## ⚙️ Environment Variables Reference

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `APP_NAME` | string | `"AI Startup Idea Validation API"` | Application display name in logs and telemetry |
| `ENVIRONMENT` | string | `"development"` | Runtime mode (`development`, `staging`, `production`). In production, Google GIS signature verification is strictly enforced. |
| `DEBUG` | boolean | `true` | Enables verbose debug logging and traceback exposure |
| `API_V1_STR` | string | `"/api/v1"` | Canonical API prefix for versioned routes |
| `DATABASE_URL` | string | `"sqlite:///./startup_validation.db"` | SQLAlchemy database connection URI (SQLite or PostgreSQL) |
| `TEST_DATABASE_URL` | string | `"sqlite:///./test.db"` | Isolated database connection string used during pytest runs |
| `REDIS_URL` | string | `"redis://localhost:6379/0"` | Redis instance URL for Celery message broker and embedding caching |
| `LLM_PROVIDER` | string | `"mock"` | Qualitative reasoning engine (`gemini`, `ollama`, or `mock`) |
| `GEMINI_API_KEY` | string | `None` | Google Gemini API credential for generative reasoning |
| `JWT_SECRET_KEY` | string | `"default-insecure-secret-key-change-me-1234567890"` | HMAC-SHA256 signing secret for session access tokens |
| `JWT_ALGORITHM` | string | `"HS256"` | JWT token hashing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | integer | `10080` | Access token lifespan (10080 min = 7-day expiry) |
| `EMBEDDING_MODEL` | string | `"all-MiniLM-L6-v2"` | HuggingFace SentenceTransformers embedding model identifier (384 dimensions) |
| `SIMILARITY_THRESHOLD` | float | `0.85` | Cosine similarity threshold for flagging direct competitor ventures |
| `LOG_LEVEL` | string | `"INFO"` | Logging verbosity level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |

---

## 🧪 Running Automated Tests

### Backend Unit & Integration Tests (`pytest`)
CheckStart AI includes a comprehensive test suite covering authentication, chat sessions, prompt injection guardrails, 7-parameter scoring formulas, Layer 8 claim taxonomy, FAISS vector similarity, and multi-tenant isolation:

```bash
cd backend
python -m pytest -v
```

> **Backend Suite Status:** 19 test modules, **111 test cases passing (100% pass rate)**.

### Frontend Unit & Component Tests (`vitest`)
Test the frontend mathematical engine, score clamping, progress-bar thresholds, and formatting logic:

```bash
cd frontend
npm run test
```

> **Frontend Suite Status:** **75 test cases passing (100% pass rate)**.

### Frontend Production Build Test
Verify TypeScript type checking and Vite production bundling:

```bash
cd frontend
npm run build
```

---

## 📡 Canonical API Endpoints

All endpoints are hosted under `/api/v1` (with `/api` compatibility aliases) and strictly enforce multi-tenant authorization (returns HTTP 403/404 for unowned ideas):

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new student founder account |
| `POST` | `/api/v1/auth/login` | Student login (returns 7-day JWT access token) |
| `POST` | `/api/v1/auth/google` | Google GIS SSO verification (cryptographically verified in production) |
| `GET` | `/api/v1/users/profile` | Retrieve student personal and academic profile |
| `PUT` | `/api/v1/users/profile` | Update personal/academic details and theme settings |
| `PUT` | `/api/v1/users/password` | Change user password with current password verification |
| `GET` | `/api/v1/ideas` | List founder's ventures with search and status filters |
| `POST` | `/api/v1/ideas` | Create a new startup venture record |
| `GET` | `/api/v1/ideas/{id}/reports` | List all historical validation reports for a venture |
| `GET` | `/api/v1/ideas/{id}/reports/{report_id}` | Fetch a specific immutable validation report by ID |
| `GET` | `/api/v1/ideas/{id}/compare?from=1&to=2` | Compare version deltas ($S_{v2}-S_{v1}$) and recommendation completion |
| `POST` | `/api/v1/ideas/{id}/validate` | Run or re-run the 15-layer validation pipeline on a venture |
| `POST` | `/api/v1/ideas/{id}/chat` | Multi-turn FSM dialogue turn (entity extraction and guidance) |
| `POST` | `/api/v1/ideas/compare` | Multi-idea comparative matrix for 2–4 ventures |

---

## ⚠️ Known Limitations

1. **SQLite Concurrency & Multi-Worker Scaling**:
   The default local setup utilizes SQLite with WAL mode. Because SQLite relies on database-level file locking, high write concurrency under multi-threaded Celery workers or multiple concurrent users can experience busy/locked timeouts. For multi-user staging and production deployments, configure `DATABASE_URL` with PostgreSQL.
2. **Static Competitor Benchmark Dataset**:
   The semantic similarity engine matches concepts against indexed startup records and pre-seeded domain benchmark ventures. Real-time web crawling of newly launched competitors requires external search API keys (e.g. SerpAPI) and is bounded by external API quotas.
3. **Fixed Parameter Weights**:
   The authoritative `report_v1` scoring engine assigns fixed, mathematically validated weights across the 7 parameters (Market Demand 0.25, Problem Severity 0.20, Competition 0.15, Target Customer 0.10, Innovation 0.10, Feasibility 0.10, Revenue Potential 0.10). The framework does not dynamically re-weight parameters across disparate venture archetypes (e.g., deep tech hardware vs. B2C mobile apps).
4. **Founder-Input Dependence & Socratic Quality**:
   The precision of generated recommendations and viability classifications directly correlates with the specificity of the founder's pitch inputs. Broad or vague submissions (e.g., target customer "everyone", missing revenue models) trigger intentional Layer 8 penalty caps.

---

## ⚠️ Disclaimer

CheckStart AI is designed as an **evidence-aware decision-support tool** to assist entrepreneurs and educators in preliminary feasibility analysis, risk identification, and iterative hypothesis testing. It does **not** guarantee commercial success, funding, or product-market fit, and should be utilized alongside direct primary customer research and market experimentation.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
