# VibeJira Project Progress Summary

**Last Verified:** YYYY-MM-DD (Replace with current date)

**Objective:** Create a web application using React and Node.js to display and interact with JIRA tickets, featuring a dashboard and specific JIRA actions.

## Current State Overview

*   **Repository:** Git repository initialized at the project root.
*   **Structure:** Code is separated into `frontend/` (React) and `backend/` (Node.js) directories.
*   **Data Flow:** Frontend fetches an initial ticket list from the backend `/api/tickets`. Backend uses a configured Personal Access Token (PAT) to proxy requests to the JIRA API.
*   **Authentication:** Backend authenticates to JIRA using a **PAT** configured via environment variables. No user-facing login flow is currently implemented.
*   **Database:** Currently **NO database** integrated.

---

## Frontend (`frontend/`)

*   **Location:** `/frontend` directory.
*   **Tech Stack:** React, CoreUI v5, `react-scripts`.
*   **Setup:** Standard Create React App structure.
*   **Run:** `cd frontend && npm install && npm start` (Runs on `http://localhost:3000` by default). Can also be run via `npm run dev:frontend` or `npm run start:frontend` from the root directory.
*   **Theme:** CoreUI Dark theme enabled globally via `frontend/public/index.html` (`data-coreui-theme="dark"`).
*   **Core Component:** `frontend/src/components/Dashboard.js`.
*   **API Integration:**
    *   On mount, calls the backend `GET /api/tickets` endpoint (default: `http://localhost:3001/api/tickets`) with a hardcoded JQL query (`project = SWDEV ORDER BY created DESC`).
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

*   **Location:** `/backend` directory.
*   **Tech Stack:** Node.js, Express.js, `axios`, `cors`, `dotenv`.
*   **Setup:** Standard Node.js/Express structure (`src/app.js`, `config`, `controllers`, `routes`, `services`).
*   **Run:**
    *   `cd backend && npm install` (After creating/populating `.env`).
    *   `npm run dev`: Uses `nodemon`, sets `JIRA_API_DEBUG=true` (runs on `http://localhost:3001` by default).
    *   `npm start`: Runs production-like start (no debug flag).
*   **Configuration (`backend/.env`):** **Requires manual creation and population.** Needs:
    *   `PORT` (e.g., 3001)
    *   `JIRA_BASE_URL` (Your JIRA instance base URL)
    *   `JIRA_PAT` (Your generated Personal Access Token)
    *   `FRONTEND_ORIGIN` (e.g., `http://localhost:3000`)
*   **Authentication:**
    *   **Uses PAT:** `jiraService.js` configures a global `axios` instance with `Authorization: Bearer <JIRA_PAT>` header using the value from `.env`.
    *   **No User Login Flow:** All API requests are authenticated as the single user associated with the PAT.
    *   **No Auth Middleware:** API routes under `/api/tickets` do not have explicit authentication middleware checks (rely on PAT validity at the JIRA service level).
*   **API Endpoints (mounted under `/api`):**
    *   `GET /tickets/summary`: Defined, returns **mock** data.
    *   `GET /tickets`: Searches issues via JQL. **Called by frontend.**
    *   `GET /tickets/:issueKey/comments`: Fetches comments.
    *   `POST /tickets/:issueKey/comments`: Adds a comment.
    *   `PUT /tickets/:issueKey/labels`: Adds a label.
    *   `GET /tickets/:issueKey/history`: Fetches issue details with `expand=changelog`.
*   **JIRA Service (`backend/src/services/jiraService.js`):** Contains `axios` logic to call JIRA REST API v3 endpoints using the PAT-configured instance.
*   **Debugging:**
    *   If `JIRA_API_DEBUG=true` (set by `npm run dev`), enables detailed `axios` request/response console logging for JIRA calls via interceptors.
    *   Performs a JIRA API sanity check (`GET /rest/api/3/myself`) on startup in debug mode and logs success or a detailed warning on failure.
*   **Limitations / TODOs:**
    *   `GET /api/tickets/summary` needs implementation with actual JQL aggregation.
    *   No specific error handling if PAT is invalid/expired (will likely result in 401/403 from JIRA propagated by `axios`).

---

## Root Level (`/`)

*   **`package.json`:** Contains scripts using `concurrently` to run frontend and backend together (`npm run dev`, `npm start`). Also includes scripts to manage individual parts (`dev:frontend`, `dev:backend`, etc.) and installation (`install:all`, `postinstall`).
*   **`.gitignore`:** Configured to ignore common files and `node_modules` for both `frontend/` and `backend/`.

---

## Next Steps (Potential)

*   Implement fetching and displaying real comments in the frontend sidebar.
*   Implement adding comments/labels from the frontend sidebar.
*   Implement fetching real data for the summary cards (requires backend `/api/tickets/summary` logic).
*   Make top filter buttons functional (update frontend state, trigger backend API calls).
*   Consider adding more robust error handling in the backend, especially for PAT/JIRA API errors.
*   Refine frontend UI/UX based on real data.
*   Add more robust error handling generally (frontend and backend).
*   Consider adding unit/integration tests. 