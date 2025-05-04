# VibeJira Project Progress Summary

**Objective:** Create a web application to display and interact with JIRA tickets, featuring a dashboard and specific JIRA actions.

## Current State Overview

*   **Repository:** Initialized Git repo at the root.
*   **Structure:** Separate `frontend/` and `backend/` directories.
*   **Data:** All frontend data is **mock**. Backend endpoints mostly defined and rely on JIRA API calls via PAT.
*   **Database:** Currently **NO database** integrated.

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

*   **Tech Stack:** Node.js, Express.js, `axios`, `cors`, `dotenv`.
*   **Setup:** Standard Node.js/Express structure (`src/app.js`, `config`, `controllers`, `routes`, `services`).
*   **Run:** `cd backend && npm install`, then create/populate `.env` (see below), then `npm run dev` (uses `nodemon`, runs on `http://localhost:3001` by default).
*   **Configuration (`backend/.env`):** **Requires manual creation and population.** Needs:
    *   `PORT` (default: `3001`)
    *   `JIRA_BASE_URL` (e.g., `https://your-domain.atlassian.net`)
    *   `JIRA_PAT` (Your JIRA Personal Access Token)
    *   `FRONTEND_ORIGIN` (default: `http://localhost:3000`)
*   **Authentication:**
    *   Uses a JIRA Personal Access Token (PAT) configured via the `JIRA_PAT` environment variable.
    *   The PAT is used directly in the `Authorization: Bearer` header for all JIRA API requests made by `jiraService.js`.
    *   OAuth 2.0 flow and session management have been **removed**.
*   **API Endpoints (`/api/*`):**
    *   `GET /tickets/summary`: Defined, returns **mock** data. TODO: Implement actual JQL aggregation.
    *   `GET /tickets`: Searches issues via JQL (translates simple `?filter=` params).
    *   `GET /tickets/:issueKey/comments`: Fetches comments.
    *   `POST /tickets/:issueKey/comments`: Adds a comment.
    *   `PUT /tickets/:issueKey/labels`: Adds a label.
    *   `GET /tickets/:issueKey/history`: Fetches issue details with `expand=changelog`.
*   **JIRA Service (`src/services/jiraService.js`):** Contains `axios` logic to call JIRA REST API v3 endpoints using the configured PAT.
*   **Limitations / TODOs:**
    *   `GET /api/tickets/summary` needs implementation.
    *   Frontend needs integration with backend API.

---

## Next Steps (Potential)

*   Integrate Frontend with Backend API calls (fetching/displaying real data).
*   Implement actual JQL aggregation for the `/api/tickets/summary` endpoint.
*   Refine frontend UI/UX based on real data.
*   Add more robust error handling (frontend and backend).
*   Consider adding unit/integration tests. 