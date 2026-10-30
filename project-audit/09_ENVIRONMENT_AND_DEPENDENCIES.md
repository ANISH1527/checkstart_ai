# 09. Environment Variables & Dependencies Audit

This document provides a comprehensive inventory of all environment variables and package dependencies across the backend and frontend codebases.

---

## 1. Environment Variables Inventory

### Backend Configuration (`backend/app/core/config.py`, `backend/.env.example`)

| Variable Name | Purpose | Referencing Source File | Required vs Optional | Expected Format | Safe Example Value |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Relational database connection string | `app/core/config.py:7`, `app/database/connection.py:7` | **Required** (Defaults to SQLite) | SQLAlchemy URI (`postgresql://...` or `sqlite:///...`) | `postgresql://user:pass@localhost:5432/startupdb` |
| `TEST_DATABASE_URL` | Isolated test database connection string | `app/core/config.py:8`, `app/tests/conftest.py` | Optional (Defaults to SQLite) | SQLite URI | `sqlite:///./test.db` |
| `REDIS_URL` | Redis cache and Celery broker connection string | `app/core/config.py:9`, `app/core/celery_app.py:5`, `app/main.py:40` | Optional in dev, **Required** in prod | Redis URI (`redis://host:port/db`) | `redis://localhost:6379/0` |
| `LLM_PROVIDER` | Active LLM inference provider selector | `app/core/config.py:10`, `app/services/llm_service.py:10` | **Required** | String enum: `gemini` or `mock` | `gemini` |
| `GEMINI_API_KEY` | Google AI Studio API key for Gemini Pro inference | `app/core/config.py:11`, `app/services/llm_providers/gemini_provider.py:12` | **Required** if `LLM_PROVIDER=gemini` | Alphanumeric API key string | `AIzaSyD...` (redacted) |
| `JWT_SECRET_KEY` | HMAC secret key used to sign access tokens | `app/core/config.py:12`, `app/core/security.py:15` | **Required** in production | High-entropy random string ($\ge 32$ chars) | `e4b3c2a1...` (redacted) |
| `JWT_ALGORITHM` | Cryptographic algorithm for JWT signatures | `app/core/config.py:13`, `app/core/security.py:15` | Optional (Defaults to `HS256`) | JWT Algorithm string | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Lifetime of JWT bearer access tokens | `app/core/config.py:14`, `app/core/security.py:12` | Optional (Defaults to `60`) | Positive Integer (Minutes) | `60` |
| `ENVIRONMENT` | Runtime deployment environment | `app/core/config.py:15`, `app/main.py:28` | **Required** | `development`, `testing`, or `production` | `development` |
| `LOG_LEVEL` | Application logging verbosity | `app/core/config.py:16`, `app/core/logging.py:12` | Optional (Defaults to `INFO`) | `DEBUG`, `INFO`, `WARNING`, `ERROR` | `INFO` |
| `APP_NAME` | FastAPI application title | `app/core/config.py:18`, `app/main.py:56` | Optional | String | `AI Startup Idea Validation API` |
| `API_V1_STR` | Primary API version URL prefix | `app/core/config.py:20`, `app/main.py:57` | Optional (Defaults to `/api/v1`) | URL path string | `/api/v1` |
| `EMBEDDING_MODEL` | HuggingFace sentence transformer model name | `app/core/config.py:23`, `app/services/embedding_service.py:23` | Optional | HuggingFace model repo name | `all-MiniLM-L6-v2` |
| `SIMILARITY_HIGH_THRESHOLD` | Threshold for flagging high semantic overlap | `app/core/config.py:25`, `app/services/similarity_service.py:90` | Optional (Defaults to `0.85`) | Float between `0.0` and `1.0` | `0.85` |
| `SIMILARITY_MED_THRESHOLD` | Threshold for moderate semantic overlap | `app/core/config.py:26`, `app/services/similarity_service.py:91` | Optional (Defaults to `0.72`) | Float between `0.0` and `1.0` | `0.72` |

### Frontend Configuration (`frontend/.env.example`, `frontend/.env`)

| Variable Name | Purpose | Referencing Source File | Required vs Optional | Expected Format | Safe Example Value |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Base URL pointing to the FastAPI backend API | `frontend/src/services/api.ts:18` | Optional (Defaults to `/api`) | URL prefix or full URL | `/api` |
| `VITE_GOOGLE_CLIENT_ID`| Google Cloud OAuth 2.0 Client ID for GIS | `frontend/src/pages/LoginPage.tsx:50` | **Required** for Google OAuth | Google client ID string | `659981468656-...apps.googleusercontent.com` |

---

## 2. Backend Dependencies Audit (`requirements.txt`)

| Package Name | Specified Version | Purpose in Codebase | Usage Audit & Notes |
| :--- | :--- | :--- | :--- |
| `fastapi` | `>=0.109.0` | Core web framework | **Active**: Defines all application routes, controllers, and lifespan hooks. |
| `uvicorn[standard]` | `>=0.27.0` | ASGI server | **Active**: Boots FastAPI server locally and in Docker container. |
| `pydantic` | `>=2.6.0` | Schema validation | **Active**: Defines all request and response models across `app/schemas/`. |
| `pydantic-settings` | `>=2.1.0` | Settings management | **Active**: Powers `Settings` class loading `.env` variables. |
| `sqlalchemy` | `>=2.0.25` | Relational ORM | **Active**: Defines all 15 database tables and executes transactional queries. |
| `alembic` | `>=1.13.1` | Database migrations | **Active**: Manages 7 database revision migration scripts. |
| `psycopg2-binary` | `>=2.9.9` | PostgreSQL driver | **Active**: Production database driver configured in `docker-compose.yml`. |
| `python-jose[cryptography]`| `>=3.3.0` | JWT token management | **Active**: Encodes and verifies access tokens and single-use reset tokens. |
| `passlib[bcrypt]` | `>=1.7.4` | Password hashing | **Active**: Powers salted password hashing in `app/utils/hashing.py`. |
| `python-multipart` | `>=0.0.6` | Form-data parsing | **Active**: Enables OAuth2 form-data parsing on `/auth/login`. |
| `sentence-transformers`| `>=2.3.1` | Dense vector embeddings | **Active**: Generates 384-dim semantic embeddings with `all-MiniLM-L6-v2`. |
| `scikit-learn` | `>=1.4.0` | Machine learning utilities | **Active**: Computes cosine similarities and vector distances. |
| `faiss-cpu` | `>=1.7.4` | Vector search indexing | **Unused / Redundant**: In-memory Python cosine similarity is used; FAISS index is not initialized. |
| `google-generativeai` | `>=0.3.2` | Google Gemini SDK | **Active**: Powers LLM validation analysis and multi-idea synthesis. |
| `httpx` | `>=0.26.0` | Async HTTP client | **Active**: Dispatches outbound webhook HTTP requests in `tasks.py`. |
| `pytest` | `>=8.0.0` | Test framework | **Active**: Runs 85 unit and integration tests. |
| `pytest-asyncio` | `>=0.23.5` | Async test extension | **Active**: Supports asynchronous test cases. |
| `python-dotenv` | `>=1.0.1` | `.env` file loader | **Active**: Parses local environment files. |
| `slowapi` | `>=0.1.9` | API rate limiting | **Active**: Enforces IP rate limits on auth and validation endpoints. |
| `celery` | `>=5.3.6` | Background task queue | **Active**: Executes asynchronous validation jobs in `tasks.py`. |
| `redis` | `>=5.0.1` | Redis client | **Active**: Caches embeddings and provides Celery message broker. |
| `structlog` | `>=24.1.0` | Structured JSON logger | **Active**: Formats audit logs and execution latency metrics. |

---

## 3. Frontend Dependencies Audit (`package.json`)

| Package Name | Specified Version | Purpose in Codebase | Usage Audit & Notes |
| :--- | :--- | :--- | :--- |
| `react` | `^18.3.1` | Frontend UI library | **Active**: Core component runtime. |
| `react-dom` | `^18.3.1` | DOM renderer for React | **Active**: Renders React tree to browser DOM. |
| `react-router-dom` | `^6.26.2` | Client-side routing | **Active**: Manages public, founder, and admin protected routes. |
| `lucide-react` | `^0.441.0` | SVG icon library | **Active**: Renders modern icons across all UI pages and sidebars. |
| `recharts` | `^2.12.7` | Charting library | **Active**: Renders 7-parameter radar polygons and score timeline charts. |
| `jspdf` | `^2.5.2` | Client-side PDF generation | **Active**: Builds downloadable PDF validation reports. |
| `html2canvas` | `^1.4.1` | HTML canvas capture | **Active**: Captures report DOM elements as images for PDF embedding. |
| `typescript` (dev) | `^5.6.2` | Static type checker | **Active**: Enforces strict typing (`npm run build` runs `tsc && vite build`). |
| `vite` (dev) | `^5.4.6` | Development & build tool | **Active**: Serves HMR dev server and bundles production assets. |
| `tailwindcss` (dev) | `^3.4.11` | Utility CSS framework | **Active**: Defines design system, typography, and dark mode classes. |
| `postcss` (dev) | `^8.4.47` | CSS transformation tool | **Active**: Processes Tailwind CSS directives. |
| `autoprefixer` (dev) | `^10.4.20` | CSS vendor prefixing | **Active**: Adds browser-specific vendor prefixes automatically. |
