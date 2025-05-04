require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  jiraBaseUrl: process.env.JIRA_BASE_URL,
  jiraPat: process.env.JIRA_PAT,
  frontendOrigin: process.env.FRONTEND_ORIGIN,
  frontendUrl: process.env.FRONTEND_URL,
}; 