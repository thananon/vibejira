# VibeJira

A web application to display and interact with JIRA tickets.

## Overview

This project consists of two main parts:

*   **Backend (`backend/`)**: A Node.js/Express application that connects to the JIRA REST API using a Personal Access Token (PAT) to fetch and manipulate ticket data.
*   **Frontend (`frontend/`)**: A React application built with Create React App and CoreUI v5 for the user interface. It communicates with the backend API.

## Prerequisites

*   Node.js (v16 or later recommended)
*   npm (usually comes with Node.js)
*   A JIRA Cloud instance
*   A JIRA Personal Access Token (PAT) - See [Atlassian Documentation](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/) on how to create one. You'll need permissions to read/write JIRA issues.

## Backend Setup (`backend/`)

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create a `.env` file:**
    Create a file named `.env` in the `backend/` directory and add the following variables, replacing the placeholder values with your actual JIRA information:

    ```dotenv
    # Backend server port
    PORT=3001

    # Your JIRA Cloud instance base URL
    JIRA_BASE_URL=https://your-domain.atlassian.net

    # Your JIRA Personal Access Token (PAT)
    JIRA_PAT=your_jira_personal_access_token_here

    # Frontend URL (for CORS)
    FRONTEND_ORIGIN=http://localhost:3000
    ```

4.  **Run the backend (development mode):**
    ```bash
    npm run dev
    ```
    The backend server will start, typically on `http://localhost:3001`. It uses `nodemon` to automatically restart on file changes.

## Frontend Setup (`frontend/`)

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend 
    # Or from the root: cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the frontend:**
    ```bash
    npm start
    ```
    The React development server will start, and the application should open automatically in your browser, typically at `http://localhost:3000`.

## Running the Application

1.  Start the backend server first (follow Backend Setup steps).
2.  Start the frontend development server (follow Frontend Setup steps).
3.  Open your browser to `http://localhost:3000` (or the port specified by the frontend).

## Features

*   Dashboard view displaying JIRA defect tickets.
*   Filtering by status (Ongoing, Triage Pending, Waiting, Done, Rejected, Not RCCL Issue), assignee, and date (last week, last month, all time, date range).
*   Summary cards showing ticket counts for key statuses.
*   Collapsible ticket tables grouped by priority (P1, P2, Other).
*   Clickable table rows to open a side panel with ticket details and comments.
*   Ability to update ticket state (labels) via buttons in the side panel.
*   Ability to add comments to tickets via the side panel.
*   Link to open the original JIRA ticket in a new tab.

// **Note:** The frontend currently uses mock data. Integration with the backend API endpoints is the next step. 