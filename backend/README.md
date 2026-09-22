# AI-Assisted Startup Idea Validation and Recommendation System - Backend

A complete, modular, testable FastAPI backend for the **AI-Assisted Startup Idea Validation and Recommendation System**.

The backend accepts a startup idea submission and performs an evidence-aware, multi-stage preliminary validation combining lightweight NLP extraction, LLM analysis (Gemini / Ollama / Mock abstractions), semantic vector embedding comparison, rule-based verification, weighted scoring, confidence estimation, information-gap detection, actionable recommendation generation, and iterative versioned re-validation.

---

## System Architecture

```text
Frontend (React / Next.js)
    |
    v
FastAPI API Gateway (/api/v1)
    |
    +-- Authentication (JWT + Bcrypt)
    +-- Startup Idea Management (CRUD)
    +-- Validation Engine
    +-- Validation History & Markdown Reports
    |
    v
Validation Pipeline Orchestration
    |
    ├── 1. Input Validation & Security (Prompt injection check)
    ├── 2. NLP Service (Keywords & attribute extraction)
    ├── 3. Embedding Service (Sentence Transformers / MiniLM)
    ├── 4. Similarity Service (Cosine similarity search)
    ├── 5. Rule Service (Deterministic completeness & length checks)
    ├── 6. Evidence Service (Benchmark verification layer)
    ├── 7. LLM Service (Gemini / Ollama / Mock Provider)
    ├── 8. Verification Service (Post-LLM sanity check)
    ├── 9. Scoring Engine (Deterministic 9-parameter weighted calculation)
    ├── 10. Confidence Engine (Multi-factor calibration formula)
    ├── 11. Information Gap Detection (Missing customer/pricing/revenue cues)
    ├── 12. Recommendation Engine (Actionable next-step suggestions)
    └── 13. Persistence & Audit Logging (SQLAlchemy + SQLite/PostgreSQL)
```

---

## 🛠️ Key Technology Stack

- **Framework**: FastAPI (Python 3.11+)
- **ORM & DB**: SQLAlchemy 2.0, PostgreSQL / SQLite (for zero-config local testing)
- **Migrations**: Alembic
- **Security & Auth**: JWT (PyJWT/python-jose), Password Hashing (bcrypt / passlib)
- **Validation**: Pydantic v2
- **AI & NLP**:
  - Sentence Transformers (`all-MiniLM-L6-v2`)
  - scikit-learn
  - Abstract LLM Interface supporting **Google Gemini API**, **Ollama**, and **Mock Providers**
- **Testing**: `pytest`, `httpx` / `TestClient`
- **Containerization**: Docker Compose

---

## 📊 Scoring Methodology & Formula

The overall validation score is calculated deterministically by the backend (never directly by the LLM) using configurable parameter weights totaling 100%:

| Parameter | Weight | Description |
| :--- | :---: | :--- |
| **Market Demand** | 25% | Size of market opportunity & customer pain point urgency |
| **Problem-Solution Fit** | 20% | Alignment of solution features to target problem |
| **Target Customer Clarity**| 10% | Definition of buyer persona and segment specificity |
| **Competition Environment**| 10% | Market saturations & rival positioning |
| **Uniqueness** | 10% | Value proposition differentiation |
| **Technical Feasibility** | 10% | Stack scalability & build complexity |
| **Business Potential** | 10% | Revenue model sustainability & margins |
| **Scalability** | 3% | Operational expansion efficiency |
| **Risk Level** | 2% | Execution, regulatory, and financial risk rating |

### Classification Tiers
- **90 – 100**: EXCEPTIONAL
- **75 – 89**: STRONG
- **60 – 74**: MODERATE
- **40 – 59**: WEAK
- **0 – 39**: VERY_WEAK

---

## 🎯 Confidence Calculation Methodology

```text
Confidence Score (0-100) =
  (Input Completeness * 0.30)
+ (Model Agreement * 0.30)
+ (Evidence Quality * 0.25)
+ (Rule Consistency * 0.15)
```

---

## ⚡ Quick Start & Installation

### 1. Prerequisites
- Python 3.10+ or Python 3.11+
- Virtualenv (`python -m venv venv`)

### 2. Environment Setup
Clone the repository, enter `backend`, and create virtual environment:
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux/Mac
pip install -r requirements.txt
```

### 3. Environment Variables Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your `.env` variables:
```env
APP_NAME="AI Startup Idea Validation API"
DEBUG=True
API_V1_STR="/api/v1"

# Database (SQLite by default for dev/test, PostgreSQL for production)
DATABASE_URL="sqlite:///./startup_validation.db"

SECRET_KEY="super-secret-jwt-key"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# LLM Provider: "gemini", "ollama", or "mock"
LLM_PROVIDER="mock"
GEMINI_API_KEY="your-gemini-api-key-here"

EMBEDDING_MODEL="all-MiniLM-L6-v2"
SIMILARITY_THRESHOLD=0.85
```

---

## 🚀 Running the API Server

Start the Uvicorn server:
```bash
uvicorn app.main:app --reload --port 8000
```
Access interactive OpenAPI documentation at:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🧪 Running Automated Tests

Run the complete pytest verification suite covering authentication, idea CRUD, rules, scoring formula, confidence calibration, vector similarity, and end-to-end validation pipelines:

```bash
pytest -v
```

---

## 🐳 Docker Deployment

To spin up PostgreSQL and Backend using Docker Compose:

```bash
docker-compose up --build -d
```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check status |
| `POST` | `/api/v1/auth/register` | Register new user account |
| `POST` | `/api/v1/auth/login` | Login user & return JWT token |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile |
| `POST` | `/api/v1/ideas` | Create new startup idea submission |
| `GET` | `/api/v1/ideas` | List user's startup ideas |
| `GET` | `/api/v1/ideas/{id}` | Get startup idea details |
| `PUT` | `/api/v1/ideas/{id}` | Update startup idea details |
| `DELETE`| `/api/v1/ideas/{id}` | Delete startup idea |
| `POST` | `/api/v1/ideas/{id}/validate` | Run complete validation pipeline |
| `POST` | `/api/v1/ideas/{id}/revalidate` | Increment version & re-validate |
| `GET` | `/api/v1/ideas/{id}/validation` | Fetch latest validation result |
| `GET` | `/api/v1/ideas/{id}/history` | Get validation version history |
| `GET` | `/api/v1/reports/{id}/markdown` | Export formatted Markdown report |

---

## ⚠️ Important Disclaimer
*This system does NOT claim to predict startup success with certainty. It provides a structured, evidence-aware decision-support assessment for preliminary idea validation.*
