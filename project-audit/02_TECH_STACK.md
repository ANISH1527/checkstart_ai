# 02. Complete Technology Stack Audit

Every technology listed below was verified by inspecting dependency manifests (`backend/requirements.txt`, `frontend/package.json`), Docker configuration (`backend/Dockerfile`, `backend/docker-compose.yml`), and actual source code imports.

---

## 1. Programming Languages & Runtimes

| Technology | Exact Version | Purpose in Project | Files / Folders Where Used | Rationale | Essential vs Optional |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Python** | `3.10` (Docker) / `3.13.5` (Host test env) | Backend execution runtime | `backend/` | Fast development, extensive ML/AI libraries, robust typing. | **Essential** |
| **TypeScript** | `^5.6.2` | Frontend typed language | `frontend/src/` | Type safety across API payloads, props, and UI models. | **Essential** |
| **JavaScript (ES Modules)** | ES2022+ | Build configuration & tooling | `vite.config.ts`, `postcss.config.js`, `tailwind.config.js` | Standard modern module syntax for frontend build toolchain. | **Essential** |
| **HTML5 / CSS3** | Modern Standards | UI markup and layout rendering | `frontend/index.html`, `frontend/src/index.css` | Document structure and core typography styling. | **Essential** |
| **SQL** | PostgreSQL dialect / SQLite dialect | Relational database queries | `backend/alembic/`, `backend/app/models/`, `backend/app/database/` | ACID transactions, relational integrity, schema migrations. | **Essential** |

---

## 2. Backend Frameworks & Core Libraries

| Technology | Exact Version | Purpose in Project | Files / Folders Where Used | Rationale | Essential vs Optional |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FastAPI** | `>=0.109.0` | Asynchronous REST API framework | `backend/app/main.py`, `backend/app/api/` | High performance, automatic OpenAPI `/docs` generation, Pydantic validation. | **Essential** |
| **Uvicorn (standard)** | `>=0.27.0` | ASGI web server | `backend/app/main.py`, `backend/Dockerfile` | Production-grade lightning-fast ASGI server for Python. | **Essential** |
| **Pydantic** | `>=2.6.0` | Data modeling & input validation | `backend/app/schemas/` | Robust type coercion, serialization, and JSON schema generation. | **Essential** |
| **pydantic-settings** | `>=2.1.0` | Environment configuration management | `backend/app/core/config.py` | Type-safe `.env` loading and production deployment validation. | **Essential** |
| **SQLAlchemy** | `>=2.0.25` | Object Relational Mapper (ORM) | `backend/app/models/`, `backend/app/database/` | Decoupled query construction, table relationships, transaction management. | **Essential** |
| **Alembic** | `>=1.13.1` | Database migration tool | `backend/alembic/` | Versioned, reproducible schema evolution across environments. | **Essential** |
| **psycopg2-binary** | `>=2.9.9` | PostgreSQL database driver | `backend/requirements.txt`, `backend/docker-compose.yml` | Low-level C-extension PostgreSQL driver for high throughput. | **Essential** in Prod, Optional in dev (SQLite) |
| **python-jose (cryptography)** | `>=3.3.0` | JWT encoding/decoding | `backend/app/core/security.py`, `backend/app/api/auth.py` | Secure HMAC-SHA256 token generation and verification. | **Essential** |
| **bcrypt / passlib** | `passlib>=1.7.4`, `bcrypt` | Secure password hashing | `backend/app/utils/hashing.py` | Adaptive salted password hashing resistant to rainbow table attacks. | **Essential** |
| **python-multipart** | `>=0.0.6` | Form data parsing | `backend/app/api/auth.py` | Supports standard `x-www-form-urlencoded` OAuth2 login requests. | **Essential** |
| **slowapi** | `>=0.1.9` | In-memory / Redis API rate limiting | `backend/app/core/limiter.py`, `backend/app/main.py` | Protects authentication and validation endpoints against brute-force & DoS. | **Essential** |
| **structlog** | `>=24.1.0` | Structured JSON application logging | `backend/app/core/logging.py`, `backend/app/services/` | Machine-readable audit logs for observability and pipeline latency tracking. | **Essential** |
| **Celery** | `>=5.3.6` | Distributed task queue | `backend/app/core/celery_app.py`, `backend/app/services/tasks.py` | Offloads heavy 15-layer validation runs to background workers. | **Essential** in Prod, Optional in dev |
| **Redis** | `redis-py>=5.0.1` | In-memory cache & Celery broker | `backend/app/services/embedding_cache_service.py` | Sub-millisecond embedding caching and message broker for Celery. | Optional (in-memory fallback present) |
| **HTTPX** | `>=0.26.0` | Asynchronous HTTP client | `backend/app/services/tasks.py:77-90` | Dispatches outbound webhook notifications with timeout & retries. | **Essential** |

---

## 3. AI / ML Frameworks, Models & LLMs

| Technology | Exact Version | Purpose in Project | Files / Folders Where Used | Rationale | Essential vs Optional |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **google-generativeai** | `>=0.3.2` | Official Google Gemini SDK | `backend/app/services/llm_providers/gemini_provider.py`, `backend/app/api/comparisons.py` | Primary LLM inference engine (`gemini-pro`) for venture validation and synthesis. | **Essential** in Prod, Optional in mock dev |
| **sentence-transformers** | `>=2.3.1` | Dense semantic text embeddings | `backend/app/services/embedding_service.py` | Generates 384-dimensional vector embeddings using `all-MiniLM-L6-v2`. | **Essential** (mock fallback exists for tests) |
| **scikit-learn** | `>=1.4.0` | Mathematical & ML utilities | `backend/requirements.txt` | Cosine similarity, vector operations, and ML metrics. | **Essential** |
| **faiss-cpu** | `>=1.7.4` | Vector indexing library | `backend/requirements.txt` | Declared for high-scale vector similarity search. | **Optional** (Currently in-memory cosine similarity is used) |
| **MockProvider** | Custom internal | Deterministic heuristic AI fallback | `backend/app/services/llm_providers/mock_provider.py` | Guarantees test stability and zero-cost local development without API keys. | **Essential** (Development/Testing) |

---

## 4. Frontend Frameworks, Libraries & Tools

| Technology | Exact Version | Purpose in Project | Files / Folders Where Used | Rationale | Essential vs Optional |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **React** | `^18.3.1` | Declarative UI component library | `frontend/src/` | Component-based state-driven interactive user interfaces. | **Essential** |
| **React DOM** | `^18.3.1` | React DOM renderer | `frontend/src/main.tsx` | Attaches React component tree to DOM root. | **Essential** |
| **React Router DOM** | `^6.26.2` | Client-side routing & navigation | `frontend/src/App.tsx` | Declarative URL routing, nested layouts, protected route guards. | **Essential** |
| **Vite** | `^5.4.6` | Frontend build tool & dev server | `frontend/vite.config.ts`, `frontend/package.json` | Instant Hot Module Replacement (HMR) and optimized Rollup bundling. | **Essential** |
| **Tailwind CSS** | `^3.4.11` | Utility-first CSS framework | `frontend/tailwind.config.js`, `frontend/src/index.css` | Rapid, consistent styling with dark mode and responsive breakpoints. | **Essential** |
| **PostCSS / Autoprefixer** | `postcss^8.4.47`, `autoprefixer^10.4.20` | CSS processing & vendor prefixing | `frontend/postcss.config.js` | Compiles Tailwind directives and ensures cross-browser CSS compatibility. | **Essential** |
| **Lucide React** | `^0.441.0` | UI icon library | `frontend/src/components/`, `frontend/src/pages/` | Clean, modern SVG iconography across founder and admin dashboards. | **Essential** |
| **Recharts** | `^2.12.7` | Data visualization charts | `frontend/src/components/RadarChartWidget.tsx`, `frontend/src/components/ScoreHistoryChart.tsx` | Responsive radar charts for 7 parameters and score timeline charts. | **Essential** |
| **jspdf** | `^2.5.2` | Client-side PDF generation | `frontend/src/utils/pdfExport.ts` | Generates downloadable validation reports directly in founder browser. | **Essential** |
| **html2canvas** | `^1.4.1` | HTML canvas rendering | `frontend/src/utils/pdfExport.ts` | Captures styled DOM elements (charts, gauges, tables) into PDF images. | **Essential** |

---

## 5. Storage, Infrastructure & Deployment

| Technology | Exact Version | Purpose in Project | Files / Folders Where Used | Rationale | Essential vs Optional |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SQLite 3** | Built-in Python | Default local development database | `backend/startup_validation.db`, `backend/test.db` | Zero-configuration local development and rapid isolated test execution. | **Essential** (Development) |
| **PostgreSQL** | `16-alpine` | Production relational database | `backend/docker-compose.yml` | ACID enterprise compliance, concurrent writes, foreign key indexing. | **Essential** (Production) |
| **Redis** | `7-alpine` | Production cache & message broker | `backend/docker-compose.yml` | Sub-millisecond embedding caching and task queue for Celery workers. | **Essential** (Production) |
| **Docker & Docker Compose** | Docker v20+, Compose v2+ | Containerized local & server deployment | `backend/Dockerfile`, `backend/docker-compose.yml` | Reproducible deployment orchestration across Postgres, Redis, and FastAPI. | **Essential** (Deployment) |

---

## 6. Testing, Quality & Linting Tools

| Technology | Exact Version | Purpose in Project | Files / Folders Where Used | Rationale | Essential vs Optional |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **pytest** | `>=8.0.0` (Observed: `9.1.1`) | Backend test runner | `backend/pytest.ini`, `backend/app/tests/` | Comprehensive test execution (85 unit/integration/architecture tests). | **Essential** |
| **pytest-asyncio** | `>=0.23.5` | Asynchronous test support | `backend/requirements.txt` | Enables async test cases for FastAPI endpoints. | **Essential** |
| **anyio** | `4.9.0` | Asynchronous I/O abstraction | `backend/app/tests/` | Event-loop management during test execution. | **Essential** |
| **tsc (TypeScript Compiler)** | `^5.6.2` | Frontend type checking | `frontend/package.json` (`npm run build`) | Static analysis catching type mismatches before production bundle build. | **Essential** |

---

## 7. Technology Stack Summary & Architecture Tiering

```
+---------------------------------------------------------------------------------------+
|                                    PRESENTATION TIER                                  |
|   React 18.3.1  |  TypeScript 5.6.2  |  Tailwind CSS 3.4.11  |  Vite 5.4.6            |
|   Recharts 2.12.7 (Radar/Bar)  |  Lucide Icons  |  jsPDF 2.5.2 & html2canvas          |
+---------------------------------------------------------------------------------------+
                                           |  HTTPS / JSON / SSE (Vite Proxy: /api)
                                           v
+---------------------------------------------------------------------------------------+
|                                    APPLICATION TIER                                   |
|   FastAPI 0.109.0  |  Uvicorn 0.27.0  |  Pydantic 2.6.0  |  Python 3.10 / 3.13        |
|   SlowAPI (Rate Limiting)  |  Structlog (JSON Logging)  |  python-jose (JWT HS256)   |
|   Bcrypt (Salted Hash)     |  HTTPX (Outbound Webhooks) |  Celery 5.3.6 (Async Queue) |
+---------------------------------------------------------------------------------------+
              |                                            |
              | (Vector Embeddings & LLM Inference)         | (ACID Relational Storage)
              v                                            v
+---------------------------------------+    +------------------------------------------+
|          AI & MACHINE LEARNING        |    |            DATA STORAGE TIER             |
| - Google Gemini Pro (v1 SDK)          |    | - PostgreSQL 16 (Prod) / SQLite (Dev)    |
| - SentenceTransformers (all-MiniLM-L6)|    | - SQLAlchemy 2.0.25 (ORM)                |
| - Scikit-learn (Cosine Similarity)    |    | - Alembic 1.13.1 (Schema Migrations)     |
| - MockProvider (Heuristic Fallback)   |    | - Redis 7 (Embedding Cache & Queue)      |
+---------------------------------------+    +------------------------------------------+
```
