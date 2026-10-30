# 14. Complete Workspace File Structure & Component Map

This document provides an annotated, full-tree mapping of the entire CheckStart AI repository with descriptions of each file's architectural responsibility.

---

## 1. Root Workspace Layout

```
e:\miniproject\project-1\checkstart-ai\
├── .git/                                # Git version control metadata
├── backend/                             # Python FastAPI backend service
├── frontend/                            # React + Vite TypeScript frontend application
├── project-audit/                       # Comprehensive technical audit & architecture documentation
├── AUDIT.md                             # Architectural audit and gap analysis report
├── CHANGES.md                           # Frontend and backend integration log
└── README.md                            # High-level project README documentation
```

---

## 2. Backend Directory Architecture (`backend/`)

```
backend/
├── .env.example                         # Safe template for backend environment variables
├── .gitignore                           # Git ignore rules for Python virtual environments & bytecode
├── alembic.ini                          # Alembic database migration configuration
├── docker-compose.yml                   # Production multi-container composition (Postgres, Redis, App)
├── Dockerfile                           # Container definition (Python 3.10-slim runtime)
├── pytest.ini                           # Pytest test runner configuration
├── requirements.txt                     # Backend Python dependency manifest
├── startup_validation.db                # SQLite 3 local development database file
├── test.db                              # SQLite 3 isolated automated test database file
│
├── alembic/                             # Database migration scripts
│   ├── env.py                           # Alembic environment runner loading SQLAlchemy Base
│   ├── script.py.mako                   # Migration file generation template
│   └── versions/                        # Sequential schema migration scripts
│       ├── c2c779c35412_initial_schema.py
│       ├── c1d2e3f4a5b6_phase1_versioning_feedback.py
│       ├── a3c4d5e6a7b8_add_confidence_breakdown.py
│       ├── e1a2b3c4d5e6_add_score_overrides.py
│       ├── f2b3c4d5e6a7_add_evidence_traceability.py
│       ├── b4d5e6a7b8c9_add_version_pinning_columns.py
│       └── d4e5f6a7b8c9_chat_sessions_and_profile_extensions.py
│
└── app/                                 # Core application source package
    ├── __init__.py
    ├── main.py                          # FastAPI application entry point, lifecycle & CORS setup
    │
    ├── api/                             # HTTP Controllers & API Routers
    │   ├── __init__.py
    │   ├── admin.py                     # Institutional governance and telemetry endpoints
    │   ├── auth.py                      # Local & Google OAuth authentication, password reset
    │   ├── comparisons.py               # 2-4 idea comparative matrix & Gemini synthesis
    │   ├── dashboard.py                 # Founder portfolio stats, timelines, category aggregations
    │   ├── history.py                   # Historical validation reports pagination
    │   ├── ideas.py                     # Startup idea CRUD, search, filtering, and report listing
    │   ├── profile_settings.py          # Student founder profile, theme preferences, account deletion
    │   ├── reports.py                   # Direct report lookup by ID, analyze trigger, markdown export
    │   ├── sessions.py                  # Conversational validation sessions, messages, SSE streaming
    │   ├── users.py                     # Basic user identity endpoint (/users/me)
    │   └── validation.py                # Celery validation queueing, on-demand pipeline, recommendation toggle
    │
    ├── core/                            # Core infrastructure & configuration
    │   ├── __init__.py
    │   ├── celery_app.py                # Celery background queue configuration
    │   ├── config.py                    # Pydantic Settings loading .env with environment validators
    │   ├── dependencies.py              # OAuth2 Bearer token extraction and require_admin guard
    │   ├── limiter.py                   # SlowAPI rate limiter initialization
    │   ├── logging.py                   # Structlog structured JSON logger configuration
    │   └── security.py                  # JWT access token generation and cryptographic decoding
    │
    ├── database/                        # Database connections & base models
    │   ├── __init__.py
    │   ├── base.py                      # SQLAlchemy declarative Base class
    │   └── connection.py                # Database engine setup, SessionLocal, and get_db dependency
    │
    ├── models/                          # SQLAlchemy Relational ORM Models
    │   ├── __init__.py                  # Central export of all 15 database entities
    │   ├── audit_log.py                 # AuditLog model tracking validation lifecycle events
    │   ├── chat.py                      # ValidationSession & ConversationMessage models
    │   ├── competitor.py                # Competitor model storing semantic benchmarks
    │   ├── embedding.py                 # Embedding model storing 384-dim vector arrays
    │   ├── evidence.py                  # Evidence model storing citations and reliability ratings
    │   ├── idea.py                      # Idea model representing venture concepts
    │   ├── pipeline_job.py              # PipelineJob model tracking Celery task execution
    │   ├── profile.py                   # UserProfile (academic) & UserPreference (theme) models
    │   ├── recommendation.py            # Recommendation model storing structured improvement actions
    │   ├── score.py                     # ValidationScore model storing 9 individual dimension scores
    │   ├── user.py                      # User model storing founder credentials and roles
    │   ├── user_feedback.py             # UserFeedback model storing founder score ratings
    │   └── validation.py                # ValidationResult model storing immutable historical reports
    │
    ├── prompts/                         # LLM Prompt Templates & Versioning
    │   ├── __init__.py
    │   ├── prompt_versions.py           # Prompt versions v1.0, v1.1, v1.2, and active v1.3
    │   └── validation_prompt.py         # Baseline prompt template strings
    │
    ├── repositories/                    # Data Access Layer (Repository Pattern)
    │   ├── __init__.py
    │   ├── idea_repository.py           # Encapsulates Idea entity CRUD & soft-delete queries
    │   ├── user_repository.py           # Encapsulates User lookup by email, ID, or name
    │   └── validation_repository.py     # Encapsulates ValidationResult, scores, and evidence persistence
    │
    ├── schemas/                         # Pydantic Request & Response Data Contracts
    │   ├── __init__.py
    │   ├── auth.py                      # UserLogin, UserRegister, GoogleAuthRequest, ResetPassword
    │   ├── envelope.py                  # SuccessResponse[T] and ErrorResponse standard envelopes
    │   ├── idea.py                      # IdeaCreate, IdeaUpdate, IdeaResponse schemas
    │   ├── recommendation.py            # StructuredRecommendation, RootCause, Impact schemas
    │   ├── user.py                      # UserResponse schema
    │   └── validation.py                # ValidationResponse, ScoreDetail, CompetitorDetail schemas
    │
    ├── services/                        # Core Business Logic & Algorithms Layer
    │   ├── __init__.py
    │   ├── action_prioritization_service.py # Layer 14: Ranks improvement actions by priority & effort
    │   ├── chat_service.py              # Socratic conversational assistant & entity extraction engine
    │   ├── confidence_service.py        # Layer 10: Calibrated statistical confidence score calculation
    │   ├── embedding_cache_service.py   # Redis & in-memory dictionary caching for vector embeddings
    │   ├── embedding_service.py         # Layer 3: SentenceTransformers 384-dim vector generation
    │   ├── evidence_service.py          # Layer 6: Benchmark evidence classification & verification
    │   ├── idea_profile_service.py      # Layer 1: Structural venture attribute parsing & completeness
    │   ├── improvement_impact_service.py# Layer 15: Predicted score delta estimation
    │   ├── improvement_strategy_service.py# Layer 13: Concrete experiment & strategy generation
    │   ├── information_gap_service.py   # Layer 11: Missing data and operational defect detection
    │   ├── llm_service.py               # Factory resolving active LLMProvider (Gemini vs Mock)
    │   ├── nlp_service.py               # Layer 2: Keyword extraction & heuristic sentence cues
    │   ├── rag_service.py               # Abstract RAG knowledge-retrieval service stub
    │   ├── recommendation_engine_service.py# Orchestrator for Layers 12-15 improvement pipeline
    │   ├── recommendation_service.py    # Baseline recommendation formatting
    │   ├── report_service.py            # GitHub-flavored Markdown validation report generator
    │   ├── root_cause_service.py        # Layer 12: Root cause failure diagnosis
    │   ├── rule_service.py              # Layer 5: Input length, problem presence, injection filter
    │   ├── scoring_service.py           # Layer 9: Authoritative 9-dim scoring, 7-param rollup, 5-band code
    │   ├── similarity_service.py        # Layer 4: Cosine similarity calculation & competitor matching
    │   ├── tasks.py                     # Celery task definitions (run_validation_pipeline_task) & webhooks
    │   ├── validation_service.py        # 15-Layer pipeline coordinator & multi-version comparison
    │   ├── verification_service.py      # Layer 8: Post-LLM deterministic verification & score overrides
    │   │
    │   └── llm_providers/               # Pluggable LLM Provider Implementations
    │       ├── __init__.py
    │       ├── base.py                  # Abstract base class LLMProvider
    │       ├── gemini_provider.py       # Google Gemini Pro provider with graceful fallback
    │       └── mock_provider.py         # Profile-aware heuristic mock AI engine
    │
    ├── tests/                           # Pytest Automated Test Suite (85 Tests)
    │   ├── __init__.py
    │   ├── conftest.py                  # Pytest fixtures, test database setup, and mock configurations
    │   ├── test_architectural_tasks.py  # 22 tests: async queue, health check, prompt injection, RBAC
    │   ├── test_auth.py                 # 8 tests: local login, registration, Google auth, me endpoint
    │   ├── test_benchmark.py            # 4 tests: benchmark discrimination, vague vs detailed ideas
    │   ├── test_chat_service.py         # 8 tests: session creation, entity extraction, idempotency
    │   ├── test_comparison_and_dashboard.py # 5 tests: multi-idea compare, dashboard aggregations
    │   ├── test_confidence.py           # 1 test: confidence formula mathematical bounds
    │   ├── test_ideas.py                # 1 test: idea CRUD and soft deletion
    │   ├── test_integration.py          # 4 tests: end-to-end 15-layer pipeline execution & timing
    │   ├── test_pipeline_intelligence.py# 2 tests: structural profile extraction discrimination
    │   ├── test_recommendation_pipeline.py # 14 tests: root causes, priorities, impact predictions
    │   ├── test_rules.py                # 1 test: deterministic rule checks
    │   ├── test_scoring.py              # 8 tests: weight summations, 7-param rollup, band classifications
    │   ├── test_similarity.py           # 6 tests: cosine similarity, multi-tenant external warnings
    │   └── test_validation.py           # 1 test: full validation and iterative re-validation flow
    │
    └── utils/                           # Helper Utilities & Hash Algorithms
        ├── __init__.py
        ├── hashing.py                   # Bcrypt password hashing and verification
        ├── json_utils.py                # Robust JSON repair parser for LLM output strings
        └── validators.py                # SHA-256 computation and prompt injection regex scanning
```

---

## 3. Frontend Directory Architecture (`frontend/`)

```
frontend/
├── .env                                 # Active frontend environment variables
├── .env.example                         # Template for frontend environment variables
├── index.html                           # Single-page HTML container with Google GIS script
├── package.json                         # Frontend dependencies and npm build scripts
├── package-lock.json                    # Deterministic npm package lockfile
├── postcss.config.js                    # PostCSS plugins (Tailwind & Autoprefixer)
├── tailwind.config.js                   # Tailwind CSS design tokens, fonts, and dark mode setup
├── tsconfig.json                        # TypeScript compiler options
├── tsconfig.node.json                   # TypeScript configuration for Vite build tools
├── vite.config.ts                       # Vite build configuration with /api reverse proxy
│
└── src/                                 # Frontend Application Source Code
    ├── App.tsx                          # Top-level React Router routes definition (Public, Protected, Admin)
    ├── index.css                        # Global CSS stylesheet importing Tailwind directives
    ├── main.tsx                         # React application entry point mounting onto DOM root
    │
    ├── components/                      # Reusable UI & Widget Components
    │   ├── AdminProtectedRoute.tsx      # Route guard verifying user.role == 'ADMIN'
    │   ├── AdminSidebar.tsx             # Collapsible navigation bar for institutional administrators
    │   ├── ChatHistorySidebar.tsx       # Sidebar listing founder's active conversational validation sessions
    │   ├── EmptyState.tsx               # Friendly placeholder illustration when data is empty
    │   ├── Footer.tsx                   # Site-wide marketing and legal footer
    │   ├── GoogleAccountChooserModal.tsx# Custom account selection modal for Google authentication
    │   ├── IdeaCard.tsx                 # Card component displaying startup idea overview and latest score
    │   ├── LoadingState.tsx             # Loading spinner and skeleton placeholders
    │   ├── Modal.tsx                    # Accessible modal dialog container
    │   ├── Navbar.tsx                   # Public and authenticated top navigation bar
    │   ├── ParameterProgress.tsx        # Horizontal progress bar for individual validation parameters
    │   ├── ProtectedRoute.tsx           # Route guard verifying authenticated JWT session
    │   ├── RadarChartWidget.tsx         # Recharts 7-dimensional radar chart widget
    │   ├── RiskTable.tsx                # Structured table displaying venture risks and mitigations
    │   ├── SafeMarkdown.tsx             # Native React Markdown parser neutralizing XSS
    │   ├── ScoreGauge.tsx               # Circular animated SVG gauge displaying overall validation score
    │   ├── ScoreHistoryChart.tsx        # Recharts area/line chart showing validation score timeline
    │   ├── Sidebar.tsx                  # Collapsible navigation sidebar for student founders
    │   ├── StatusBadge.tsx              # Color-coded badge for 4 classification tiers
    │   ├── Toast.tsx                    # Toast notification alert banner
    │   └── UserAvatar.tsx               # Founder avatar component supporting profile images or initials
    │
    ├── contexts/                        # React Context Global State Providers
    │   ├── AuthContext.tsx              # Authentication state, login, logout, and token restoration
    │   └── ThemeContext.tsx             # Theme state (light/dark/system) synced to backend preferences
    │
    ├── hooks/                           # Custom React Hooks
    │   └── useTheme.ts                  # Convenience hook consuming ThemeContext
    │
    ├── pages/                           # Full-Page Routed View Components
    │   ├── CompareIdeasPage.tsx         # Side-by-side comparison of 2-4 validated startup ideas
    │   ├── DashboardPage.tsx            # Founder overview dashboard with score history and portfolio
    │   ├── ForgotPasswordPage.tsx       # Password reset request form
    │   ├── LandingPage.tsx              # Public hero landing page with features and methodology
    │   ├── LoginPage.tsx                # Founder email/password login and Google One Tap
    │   ├── MyIdeasPage.tsx              # Portfolio view of all founder's saved ideas with filters
    │   ├── NewValidationPage.tsx        # Conversational AI validation assistant interface
    │   ├── ProfilePage.tsx              # Collegiate academic credentials profile management
    │   ├── RegisterPage.tsx             # Student founder registration with university fields
    │   ├── ReportResultPage.tsx         # Detailed validation report view with PDF export
    │   ├── ResetPasswordPage.tsx        # New password entry form using reset token
    │   ├── SettingsPage.tsx             # Theme preferences, password change, and account deletion
    │   │
    │   └── admin/                       # Institutional Administrator Pages
    │       ├── AdminDashboardPage.tsx   # Platform metrics, user growth, and score distribution
    │       ├── AdminIdeasPage.tsx       # Directory of all ideas across the institution
    │       ├── AdminLoginPage.tsx       # Dedicated portal login for administrators
    │       ├── AdminReportsPage.tsx     # Directory of all validation reports across the institution
    │       ├── AdminUserDetailPage.tsx  # Deep-dive founder profile and owned idea cards
    │       └── AdminUsersPage.tsx       # Directory of all registered student founders
    │
    ├── services/                        # Network & API Integration
    │   └── api.ts                       # Unified API client with automatic envelope unwrapping & auth headers
    │
    ├── types/                           # TypeScript Interface & Type Definitions
    │   └── index.ts                     # Interfaces for User, StartupIdea, ValidationReport, Stats, etc.
    │
    └── utils/                           # Client-side Utilities
        └── pdfExport.ts                 # PDF generation utility using html2canvas and jspdf
```
