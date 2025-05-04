# VibeJira Project Progress Summary

**Objective:** Create a web application to display and interact with JIRA tickets, featuring a dashboard, authentication, and specific JIRA actions.

## Current State Overview

*   **Repository:** Initialized Git repo at the root.
*   **Structure:** Separate `frontend/` and `backend/` directories.
*   **Data:** All frontend data is **mock**. Backend endpoints mostly defined but rely on JIRA API calls (integration pending).
*   **Database:** Currently **NO database** integrated. Backend uses in-memory sessions.

---

## Frontend (`frontend/`)

*   **Tech Stack:** React, CoreUI v5, `react-scripts`.
*   **Setup:** Standard Create React App structure.
*   **Run:** `cd frontend && npm install && npm start` (Runs on `http://localhost:3000` by default).
*   **Theme:** CoreUI Dark theme enabled globally via `public/index.html` (`data-coreui-theme="dark"`).
*   **Core Component:** `src/components/Dashboard.js`.
*   **Features Implemented (Mock):**
    *   **Summary Cards:** Displays 4 cards (Triage Pending, In Progress, Active P1, Completed) with mock numbers and CoreUI icons.
    *   **Filter Buttons:** Placeholder CoreUI buttons (My Open Issues, etc.) - *Not functional*.
    *   **Collapsible Ticket Tables:** Displays tickets grouped by P1, P2, Other priorities in collapsible sections. Uses CoreUI `CTable` and `CCollapse`.
    *   **Ticket Data:** Uses **mock** ticket data hardcoded in `Dashboard.js` (includes `id`, `name`, `title`, `date`, `category`, `priority`, `lastUpdated`).
    *   **Comment Sidebar:** Clicking a table row opens a CoreUI `COffcanvas`.
        *   Displays the clicked ticket's key.
        *   Shows action buttons (Add Comment, Add Label, Refresh) with icons - *Not functional*.
        *   Displays **mock** comments associated with the ticket key, styled for dark theme.
*   **API Integration:** **None.** Currently does not communicate with the backend.

---

## Backend (`backend/`)

*   **Tech Stack:** Node.js, Express.js, `express-session` (using default `MemoryStore`), `axios`, `cors`, `dotenv`.
*   **Setup:** Standard Node.js/Express structure (`src/app.js`, `config`, `controllers`, `middleware`, `routes`, `services`).
*   **Run:** `cd backend && npm install`, then create/populate `.env` (see below), then `npm run dev` (uses `nodemon`, runs on `http://localhost:3001` by default).
*   **Configuration (`backend/.env`):** **Requires manual creation and population.** Needs:
    *   `PORT`
    *   `SESSION_SECRET` (Needs a secure random value)
    *   `JIRA_BASE_URL` (e.g., `https://your-domain.atlassian.net`)
    *   `JIRA_CLIENT_ID` (From JIRA OAuth 2.0 3LO App)
    *   `JIRA_CLIENT_SECRET` (From JIRA OAuth 2.0 3LO App)
    *   `JIRA_CALLBACK_PATH` (default: `/auth/jira/callback`)
    *   `FRONTEND_ORIGIN` (default: `http://localhost:3000`)
    *   `FRONTEND_URL` (default: `http://localhost:3000`)
*   **Authentication:**
    *   Handles JIRA OAuth 2.0 (3LO) flow via `/auth/jira` and `/auth/jira/callback`.
    *   Stores tokens and basic user profile in **in-memory session** (`req.session.jiraAuth`).
    *   Provides `/auth/status` to check login state and `/auth/logout`.
    *   `requireAuth` middleware protects `/api` routes, checks for valid session/token expiry.
*   **API Endpoints (`/api/*`):**
    *   `GET /tickets/summary`: Defined, returns **mock** data. TODO: Implement actual JQL aggregation.
    *   `GET /tickets`: Searches issues via JQL (translates simple `?filter=` params).
    *   `GET /tickets/:issueKey/comments`: Fetches comments.
    *   `POST /tickets/:issueKey/comments`: Adds a comment.
    *   `PUT /tickets/:issueKey/labels`: Adds a label.
    *   `GET /tickets/:issueKey/history`: Fetches issue details with `expand=changelog`.
*   **JIRA Service (`src/services/jiraService.js`):** Contains `axios` logic to call JIRA REST API v3 endpoints.
*   **Limitations / TODOs:**
    *   **In-Memory Sessions:** Data lost on restart.
    *   **No Token Refresh:** Expired tokens require re-login.
    *   **No CSRF Protection:** OAuth `state` parameter validation is missing.
    *   `GET /api/tickets/summary` needs implementation.

---

## Next Steps (Potential)

*   Integrate Frontend with Backend API calls (Authentication, fetching/displaying real data).
*   Implement JIRA token refresh logic in backend middleware.
*   Implement CSRF protection (`state` parameter) in OAuth flow.
*   Implement actual JQL aggregation for the `/api/tickets/summary` endpoint.
*   Replace in-memory session store with a persistent one (e.g., Redis, DB) when moving towards production. 