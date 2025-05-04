# VibeJira Project Progress Summary

**Objective:** Create a web application to display and interact with JIRA tickets, featuring a dashboard, authentication, and specific JIRA actions.

## Current State Overview

*   **Repository:** Initialized Git repo at the root.
*   **Structure:** Backend code is in `backend/`. Frontend code (React) is at the **root level** of the repository.
*   **Data Flow:** Frontend fetches initial ticket list from the backend `/api/tickets`. Backend uses a configured PAT to proxy requests to the JIRA API.
*   **Authentication:** Backend authenticates to JIRA using a **Personal Access Token (PAT)** configured via environment variables. No user-facing login flow is currently implemented.
*   **Database:** Currently **NO database** integrated.

---

## Frontend (Project Root `/`)

*   **Tech Stack:** React, CoreUI v5, `react-scripts`.
*   **Setup:** Standard Create React App structure (located at the project root).
*   **Run:** `npm install && npm start` (from the project root directory. Runs on `http://localhost:3000` by default).
*   **Theme:** CoreUI Dark theme enabled globally via `public/index.html` (`data-coreui-theme="dark"`).
*   **Core Component:** `src/components/Dashboard.js`.
*   **API Integration:**
    *   On mount, calls the backend `GET /api/tickets` endpoint (defaults to `http://localhost:3001/api/tickets`) with a hardcoded JQL query (`project = SWDEV ORDER BY created DESC`).
    *   Uses standard `fetch` API.
    *   Handles loading and error states for the initial ticket fetch.
    *   Parses response assuming JIRA API structure (`data.issues`, `ticket.key`, `ticket.fields.*`).
*   **Features Implemented:**
    *   **Summary Cards:** Displays 4 cards with **mock** numbers and icons. *Data is NOT fetched from backend yet.*
    *   **Filter Buttons:** Placeholder CoreUI buttons. *Not functional.*
    *   **Collapsible Ticket Tables:** Displays **fetched** tickets grouped by P1, P2, Other priorities in collapsible sections. Filtering uses fetched `ticket.fields.priority.name`.
    *   **Comment Sidebar:** Clicking a table row opens a CoreUI `COffcanvas`.
        *   Displays the correct `ticket.key`.
        *   Action buttons (Add Comment, Add Label, Refresh) are present but **disabled/not functional**.
        *   **Does NOT currently fetch or display comments.**

---

## Backend (`backend/`)

*   **Tech Stack:** Node.js, Express.js, `axios`, `cors`, `dotenv`.
*   **Setup:** Standard Node.js/Express structure (`src/app.js`, `config`, `controllers`, `middleware`, `routes`, `services`). `express-session` might still be installed/configured but is not used for JIRA auth.
*   **Run:** `cd backend && npm install`, then create/populate `.env` (see below), then `npm run dev` (uses `nodemon`, runs on `http://localhost:3001` by default).
*   **Configuration (`backend/.env`):** **Requires manual creation and population.** Needs:
    *   `PORT`
    *   `JIRA_BASE_URL` (Your JIRA Server/DC/Cloud base URL)
    *   `JIRA_PAT` (Your generated Personal Access Token)
    *   `FRONTEND_ORIGIN` (default: `http://localhost:3000`)
    *   *(SESSION_SECRET might still be needed if sessions are used for non-JIRA purposes)*
*   **Authentication:**
    *   **Uses PAT:** `jiraService.js` configures an `axios` instance with `Authorization: Bearer <JIRA_PAT>` header using the value from `.env`.
    *   **No User Login Flow:** All API requests are authenticated as the single user associated with the PAT.
    *   **No Auth Middleware:** API routes under `/api/tickets` are currently unprotected by application-level auth checks (rely on PAT validity).
*   **API Endpoints (`/api/*`):**
    *   `GET /tickets/summary`: Defined, returns **mock** data. TODO: Implement actual JQL aggregation.
    *   `GET /tickets`: Searches issues via JQL. **Used by frontend.**
    *   `GET /tickets/:issueKey/comments`: Fetches comments.
    *   `POST /tickets/:issueKey/comments`: Adds a comment.
    *   `PUT /tickets/:issueKey/labels`: Adds a label.
    *   `GET /tickets/:issueKey/history`: Fetches issue details with `expand=changelog`.
*   **JIRA Service (`src/services/jiraService.js`):** Contains `axios` logic to call JIRA REST API v3 endpoints using the PAT-configured instance.
*   **Limitations / TODOs:**
    *   `GET /api/tickets/summary` needs implementation.
    *   No specific error handling if PAT is invalid/expired (will likely result in 401/403 from JIRA via `axios` error).

---

## Next Steps (Potential)

*   Implement fetching and displaying real comments in the frontend sidebar when a ticket is clicked.
*   Implement adding comments/labels from the frontend sidebar.
*   Implement fetching real data for the summary cards (`/api/tickets/summary` endpoint needs backend logic).
*   Make top filter buttons functional (update frontend state, trigger backend API calls with different JQL/filters).
*   Consider adding more robust error handling in the backend, especially around potential JIRA API errors (e.g., invalid PAT).
*   Refine frontend UI/UX based on real data.
*   Add more robust error handling (frontend and backend).
*   Consider adding unit/integration tests. 