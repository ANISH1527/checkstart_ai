# AI Startup Idea Validation Platform - Frontend

A modern, AI-chat-first React + TypeScript frontend built with Vite, Tailwind CSS v4, Lucide React icons, and Recharts, connected directly to the FastAPI backend.

---

## 🚀 Features

- **AI-Chat Workspace**: Conversational startup idea submission & multi-stage preliminary validation.
- **Authentication**: JWT token authentication with login, registration, and session persistence.
- **Explainable Scores**: 9-parameter score breakdown, confidence calibration, strengths, weaknesses, risks, and information gap detection.
- **Actionable Recommendations**: Clear next-step suggestions with priority ratings and success metrics.
- **Version History & Charts**: Recharts trajectory graphs showing score progress across re-validation revisions (`v1`, `v2`, etc.).
- **Report Export**: Downloadable Markdown report generator.

---

## 🛠️ Quick Start

### 1. Installation
```bash
cd frontend
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Start Development Server
```bash
npm run dev
```

The frontend will run at: `http://localhost:5173`

---

## 📡 Connected Backend APIs

- `POST /api/v1/auth/register` - User Registration
- `POST /api/v1/auth/login` - User Login
- `GET /api/v1/auth/me` - Authenticated User Profile
- `POST /api/v1/ideas` - Create Startup Submission
- `GET /api/v1/ideas` - Fetch Saved Ideas
- `POST /api/v1/ideas/{id}/validate` - Execute Validation Pipeline
- `POST /api/v1/ideas/{id}/revalidate` - Increment Version & Re-validate
- `GET /api/v1/ideas/{id}/history` - Fetch Validation History
- `GET /api/v1/reports/{id}/markdown` - Export Markdown Report
