# CheckStart AI 🚀
### AI-Assisted Startup Idea Validation and Strategic Recommendation Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**CheckStart AI** is an intelligent, evidence-aware startup idea validation system designed for founders, student entrepreneurs, and startup incubators. It combines conversational AI co-piloting, lightweight NLP entity extraction, deterministic multi-dimensional scoring, vector similarity benchmarking, confidence calibration, and actionable strategic recommendations.

Unlike generic LLM wrappers that output arbitrary scores, CheckStart AI uses an **authoritative 9-dimension weighted mathematical engine** calibrated with rule-based verification, information-gap detection, and multi-version tracking (`v1` → `v2`) with delta analysis.

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

### 2. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell / Command Prompt)
   python -m venv venv
   .\venv\Scripts\activate

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure your `.env` file:
   ```bash
   cp .env.example .env
   ```

5. Run the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

   The backend will be running at **http://127.0.0.1:8000**
   - Interactive Swagger API Documentation: **http://127.0.0.1:8000/docs**
   - ReDoc Documentation: **http://127.0.0.1:8000/redoc**

---

### 3. Frontend Setup

1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install the JavaScript/TypeScript dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open **http://localhost:5173** in your web browser.

---

## ⚙️ Configuration (.env)

### Backend (`backend/.env`)
```env
# Application Settings
APP_NAME="CheckStart AI Validation API"
ENVIRONMENT="development"
DEBUG=True
API_V1_STR="/api/v1"

# Database Connection (SQLite by default; or PostgreSQL: postgresql://user:pass@localhost:5432/checkstart)
DATABASE_URL="sqlite:///./startup_validation.db"

# Security & Authentication
SECRET_KEY="your-secure-jwt-secret-key-change-in-production"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# LLM Configuration ("gemini", "ollama", or "mock")
LLM_PROVIDER="mock"
GEMINI_API_KEY="your-gemini-api-key-here"

# Vector Embedding Settings
EMBEDDING_MODEL="all-MiniLM-L6-v2"
SIMILARITY_THRESHOLD=0.85
```

### Frontend (`frontend/.env`)
```env
# API Base URL (proxied by Vite to http://localhost:8000)
VITE_API_URL=/api
```

---

## 🧪 Running Automated Tests

### Backend Unit & Integration Tests
CheckStart AI includes a comprehensive test suite covering authentication, chat sessions, prompt injection guardrails, scoring formulas, vector similarity, and comparison logic:

```bash
cd backend
python -m pytest -v
```

> **Test Suite Status:** 15 test modules, 67 test cases passing (100% pass rate).

### Frontend Production Build Test
Verify TypeScript type checking and Vite production bundling:

```bash
cd frontend
npm run build
```

---

## 📡 API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account (`{ token, user }`) |
| `POST` | `/api/auth/login` | Login with email/name and password |
| `POST` | `/api/auth/google` | Google GIS SSO credential verification |
| `GET` | `/api/auth/me` | Fetch currently authenticated user profile |
| `POST` | `/api/conversations` | Create new validation chat session |
| `POST` | `/api/conversations/{id}/messages` | Send message (triggers Turn 1 instant validation) |
| `POST` | `/api/conversations/{id}/validate` | Trigger idea validation / recalculation |
| `GET` | `/api/conversations/{id}` | Fetch session history and extracted entities |
| `GET` | `/api/validation/{id}` | Retrieve full interactive validation report |
| `GET` | `/api/ideas` | List founder's startup ventures with search and filters |
| `GET` | `/api/ideas/dashboard/stats` | Retrieve founder metrics (Total ideas, validations, average score) |
| `POST` | `/api/ideas/compare` | Multi-venture comparative matrix for 2–4 ideas |
| `PUT` | `/api/user/profile` | Update user academic profile |
| `PUT` | `/api/settings` | Update user preferences (e.g. theme mode) |

---

## ⚠️ Disclaimer

CheckStart AI is designed as an **evidence-aware decision-support tool** to assist entrepreneurs and educators in preliminary feasibility analysis, risk identification, and iterative hypothesis testing. It does **not** guarantee commercial success, funding, or product-market fit, and should be utilized alongside direct primary customer research and market experimentation.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
