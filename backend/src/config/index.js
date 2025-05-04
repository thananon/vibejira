require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  sessionSecret: process.env.SESSION_SECRET,
  jiraBaseUrl: process.env.JIRA_BASE_URL,
  jiraClientId: process.env.JIRA_CLIENT_ID,
  jiraClientSecret: process.env.JIRA_CLIENT_SECRET,
  jiraCallbackPath: process.env.JIRA_CALLBACK_PATH,
  frontendOrigin: process.env.FRONTEND_ORIGIN,
  frontendUrl: process.env.FRONTEND_URL,
  // Construct full callback URL
  get jiraCallbackUrl() {
    // Assume backend runs on same domain or needs explicit base URL if different
    const baseUrl = process.env.BACKEND_BASE_URL || `http://localhost:${this.port}`;
    return `${baseUrl}${this.jiraCallbackPath}`;
  }
}; 