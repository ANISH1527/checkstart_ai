# 05. Frontend Deep-Dive Documentation

This document provides a comprehensive technical audit of the frontend single-page application (SPA), built with React 18, TypeScript, Tailwind CSS, and Vite.

---

## 1. Entry Point & Application Architecture

The application boot sequence proceeds as follows:

```
frontend/index.html
   │
   └── <div id="root"></div>
   │
   └── <script type="module" src="/src/main.tsx"></script>
          │
          ├── React.StrictMode
          ├── ThemeProvider (contexts/ThemeContext.tsx)
          │      └── AuthProvider (contexts/AuthContext.tsx)
          │             └── BrowserRouter (react-router-dom)
          │                    └── App (App.tsx)
```

- **Root File**: `frontend/src/main.tsx` mounts the React virtual DOM onto `#root`.
- **Global Styles**: `frontend/src/index.css` imports Tailwind directives (`@tailwind base; components; utilities;`) and defines custom scrollbar styling.
- **HTML Container**: `frontend/index.html` loads Inter fonts from Google Fonts and includes the Google Identity Services client script (`https://accounts.google.com/gsi/client`) for Google Sign-In.

---

## 2. Page & Component Hierarchy

### Public Routing Tier
| Route | Page Component | Key Subcomponents | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | `LandingPage.tsx` | `Navbar`, `Footer`, `Hero`, `FeatureCards` | Public marketing page explaining value proposition and 15-layer AI validation. |
| `/login` | `LoginPage.tsx` | `Navbar`, Google GIS button, LoginForm | Email/password login and Google One Tap sign-in. |
| `/register` | `RegisterPage.tsx` | `Navbar`, Collegiate fields form | Student founder registration with university, course, and graduation year fields. |
| `/forgot-password` | `ForgotPasswordPage.tsx` | Password reset request form | Requests password reset link / token. |
| `/reset-password` | `ResetPasswordPage.tsx` | New password submission form | Submits password reset token and updates credentials. |
| `/admin/login` | `AdminLoginPage.tsx` | Admin LoginForm | Dedicated portal login for institutional administrators. |

### Protected Founder Routing Tier (`ProtectedRoute.tsx`)
| Route | Page Component | Key Subcomponents | Purpose |
| :--- | :--- | :--- | :--- |
| `/dashboard` | `DashboardPage.tsx` | `Sidebar`, `ScoreHistoryChart`, `IdeaCard`, `EmptyState` | Founder command center showing portfolio stats, score trends, and quick actions. |
| `/validate` | `NewValidationPage.tsx` | `ChatHistorySidebar`, `SafeMarkdown`, `ParameterProgress` | Real-time conversational AI validation interface with Socratic questioning. |
| `/report/:id` | `ReportResultPage.tsx` | `ScoreGauge`, `StatusBadge`, `RadarChartWidget`, `RiskTable` | In-depth validation report showing 7-parameter scores, risks, and recommendations. |
| `/ideas` | `MyIdeasPage.tsx` | `Sidebar`, `IdeaCard`, Search & Category Filter bar | Portfolio view of all founder's saved ideas with report version counts. |
| `/compare` | `CompareIdeasPage.tsx` | `RadarChartWidget`, Multi-idea comparison matrix | Side-by-side radar and parameter matrix comparing 2 to 4 validated ventures. |
| `/profile` | `ProfilePage.tsx` | `Sidebar`, Academic profile form | Profile management for student founder credentials and university details. |
| `/settings` | `SettingsPage.tsx` | `Sidebar`, Theme selector, Password change form, Delete account modal | System settings, light/dark mode preference, and identity verification. |

### Protected Admin Routing Tier (`AdminProtectedRoute.tsx`)
| Route | Page Component | Key Subcomponents | Purpose |
| :--- | :--- | :--- | :--- |
| `/admin/dashboard` | `AdminDashboardPage.tsx` | `AdminSidebar`, Category Pie Chart, Score distribution bars | Institution-wide analytics, user growth curves, and platform score distributions. |
| `/admin/users` | `AdminUsersPage.tsx` | `AdminSidebar`, Users data table, Provider filter | Directory of all registered student founders across universities. |
| `/admin/users/:id` | `AdminUserDetailPage.tsx` | `AdminSidebar`, Founder idea cards | Deep-dive profile into a single founder's submitted concepts and reports. |
| `/admin/ideas` | `AdminIdeasPage.tsx` | `AdminSidebar`, Ideas data table, Industry filter | Platform-wide ideas directory with owner links and latest scores. |
| `/admin/reports` | `AdminReportsPage.tsx` | `AdminSidebar`, Reports data table | Platform-wide validation reports audit log with download capabilities. |

---

## 3. Client State Management Architecture

The frontend avoids heavyweight global state stores (Redux, MobX) in favor of lightweight, decoupled React Contexts and local hook state:

```
┌─────────────────────────────────────────────────────────────┐
│                       ThemeContext                          │
│  - State: 'light' | 'dark' | 'system'                       │
│  - Sync: Persisted in localStorage and synced via           │
│          api.updateSettings() when authenticated             │
└─────────────────────────────────────────────────────────────┘
                               ▲
                               │
┌─────────────────────────────────────────────────────────────┐
│                       AuthContext                           │
│  - State: user: User | null, token: string | null           │
│  - Loading: boolean, isAdmin: boolean                       │
│  - Methods: login(), logout(), updateUser()                 │
│  - Token Storage: 'auth_token' & 'ai_validate_token'        │
│  - Verification: Calls api.get('/auth/me') on app mount     │
└─────────────────────────────────────────────────────────────┘
                               ▲
                               │
┌─────────────────────────────────────────────────────────────┐
│                 Page / Component Local State                │
│  - NewValidationPage: messages, activeConv, structuredState │
│  - ReportResultPage: report, allVersions, exportingPdf      │
│  - CompareIdeasPage: selectedIdeas, comparisonResult        │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. API Client & Request Pipeline (`src/services/api.ts`)

Located in `frontend/src/services/api.ts`, the API client is a unified singleton object with built-in authentication header injection, envelope unwrapping, and 401 interceptors.

```typescript
// 1. Base URL configuration
const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

// 2. Auth Header Injection
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('ai_validate_token') || localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// 3. Response & Envelope Unwrapping Handler
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return { message: 'Success' } as unknown as T;
  
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) {
      // Clear expired credentials
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    throw new Error(data.message || data.detail || 'An unexpected error occurred.');
  }

  // Automatically unwrap standard backend envelope { success: true, data: T }
  if (data && typeof data === 'object' && 'data' in data && data.success === true) {
    return data.data as T;
  }
  return data;
}
```

---

## 5. UI Libraries, Visual Styling & Safe Rendering

1. **Tailwind CSS Styling**:
   - Modern glassmorphic cards (`bg-white/80 dark:bg-slate-900/80 backdrop-blur-md`).
   - Dark mode enabled via `class` strategy in `tailwind.config.js`.
2. **Recharts Data Visualization**:
   - `RadarChartWidget.tsx`: Renders visual 7-parameter radar polygons across:
     1. Market Demand
     2. Problem Severity
     3. Competition & Moat
     4. Target Customer Clarity
     5. Innovation & Uniqueness
     6. Technical Feasibility
     7. Revenue Potential
   - `ScoreHistoryChart.tsx`: Area and line chart showing score progression over validation versions.
3. **Safe Markdown Rendering (`src/components/SafeMarkdown.tsx`)**:
   - Renders AI responses containing bolding (`**`), lists (`- `, `1. `), headings (`###`), and inline code (`` ` ``) into native React DOM elements.
   - Zero use of `dangerouslySetInnerHTML`, completely neutralizing Cross-Site Scripting (XSS) vectors.
4. **PDF Report Export (`src/utils/pdfExport.ts`)**:
   - Uses `html2canvas` to render the report DOM container into high-resolution canvas bitmap.
   - Uses `jspdf` to generate multi-page downloadable PDF reports formatted for print and investor presentations.

---

## 6. End-to-End User Action Traces

### Trace 1: Conversational Chat to Report Generation
```
1. User types "I want to build an AI tutor for college coders charging $10/mo" in NewValidationPage.
2. Form submits → isSendingMessage = true.
3. api.sendMessage(conversationId, text) sends POST /api/conversations/{id}/messages.
4. Backend extracts entities (problem, target customer, revenue model).
5. Backend returns userMessage + assistantMessage + updated structuredData.
6. UI displays assistant reply formatted via SafeMarkdown; updates completeness bar to 65%.
7. User types "Validate now" or clicks "Validate Idea".
8. api.validateConversation(conversationId) sends POST /api/conversations/{id}/validate.
9. Backend executes 15-layer pipeline and returns reportId.
10. UI transitions via navigate(`/report/${res.reportId}`).
11. ReportResultPage mounts, calls api.getReport(reportId), and displays full score breakdown.
```

### Trace 2: Multi-Idea Venture Comparison
```
1. Founder opens /compare page.
2. api.getIdeas() loads founder's validated ideas.
3. User selects 3 ideas via checkboxes.
4. api.compareIdeas([id1, id2, id3]) sends POST /api/ideas/compare.
5. Backend verifies validation reports exist for all 3 ideas.
6. Backend computes radar overlay coordinates and invokes Gemini synthesis.
7. Frontend receives comparison result:
   - Recharts renders multi-colored overlapping radar polygons.
   - Parameter matrix displays comparative score columns with color-coded badges.
   - SafeMarkdown renders the AI venture synthesis and decision-support disclaimer.
```
