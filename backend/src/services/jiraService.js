const axios = require('axios');
const config = require('../config');

// Create an axios instance pre-configured for JIRA API v3 (Cloud)
// Use v2 if targeting older JIRA Server/DC instances specifically
const jiraApi = axios.create({
  baseURL: `${config.jiraBaseUrl}/rest/api/3`, // Use API v3 for Cloud
});

// Helper to add Authorization header
const getAuthHeaders = (accessToken) => ({
  Authorization: `Bearer ${accessToken}`,
  Accept: 'application/json',
});

// --- Service Functions --- 

/**
 * Searches for JIRA issues using JQL.
 * @param {string} accessToken - The user's JIRA access token.
 * @param {string} jql - The JIRA Query Language string.
 * @param {object} options - Optional parameters like fields, maxResults, startAt.
 * @returns {Promise<object>} - The search results from JIRA.
 */
const searchIssues = async (accessToken, jql, options = {}) => {
  try {
    const params = {
      jql: jql,
      fields: options.fields || 'summary,status,issuetype,priority,created,updated', // Default fields
      maxResults: options.maxResults || 50,
      startAt: options.startAt || 0,
      validateQuery: 'strict', // Recommended
    };
    const response = await jiraApi.get('/search', {
      headers: getAuthHeaders(accessToken),
      params: params,
    });
    return response.data;
  } catch (error) {
    console.error('JIRA API Error (searchIssues):', error.response ? error.response.data : error.message);
    throw new Error(`Failed to search JIRA issues: ${error.message}`);
  }
};

/**
 * Fetches details for a specific issue, optionally expanding fields like comments or changelog.
 * @param {string} accessToken - The user's JIRA access token.
 * @param {string} issueIdOrKey - The JIRA issue ID or key (e.g., 'PROJECT-123').
 * @param {object} options - Optional parameters like fields, expand.
 * @returns {Promise<object>} - The issue details from JIRA.
 */
const getIssue = async (accessToken, issueIdOrKey, options = {}) => {
  try {
    const params = {
      fields: options.fields, // Fetch specific fields if provided
      expand: options.expand, // Expand specific fields like 'changelog' or 'comment'
    };
    const response = await jiraApi.get(`/issue/${issueIdOrKey}`, {
      headers: getAuthHeaders(accessToken),
      params: params,
    });
    return response.data;
  } catch (error) {
    console.error(`JIRA API Error (getIssue ${issueIdOrKey}):`, error.response ? error.response.data : error.message);
    throw new Error(`Failed to get JIRA issue ${issueIdOrKey}: ${error.message}`);
  }
};

/**
 * Fetches comments for a specific issue.
 * @param {string} accessToken - The user's JIRA access token.
 * @param {string} issueIdOrKey - The JIRA issue ID or key.
 * @returns {Promise<object>} - The comments data from JIRA.
 */
const getIssueComments = async (accessToken, issueIdOrKey) => {
    try {
        // Note: JIRA API v3 endpoint for comments
        const response = await jiraApi.get(`/issue/${issueIdOrKey}/comment`, {
            headers: getAuthHeaders(accessToken),
            params: {
                orderBy: '-created' // Get newest comments first
            }
        });
        return response.data; // Structure usually includes { startAt, maxResults, total, comments: [...] }
    } catch (error) {
        console.error(`JIRA API Error (getIssueComments ${issueIdOrKey}):`, error.response ? error.response.data : error.message);
        throw new Error(`Failed to get comments for JIRA issue ${issueIdOrKey}: ${error.message}`);
    }
};

/**
 * Adds a comment to a specific issue.
 * @param {string} accessToken - The user's JIRA access token.
 * @param {string} issueIdOrKey - The JIRA issue ID or key.
 * @param {string} commentBody - The text content of the comment.
 * @returns {Promise<object>} - The newly created comment object from JIRA.
 */
const addIssueComment = async (accessToken, issueIdOrKey, commentBody) => {
    try {
        const response = await jiraApi.post(`/issue/${issueIdOrKey}/comment`, 
            { body: commentBody }, // JIRA API v3 expects body in simple format
            {
                headers: getAuthHeaders(accessToken),
            }
        );
        return response.data;
    } catch (error) {
        console.error(`JIRA API Error (addIssueComment ${issueIdOrKey}):`, error.response ? error.response.data : error.message);
        throw new Error(`Failed to add comment to JIRA issue ${issueIdOrKey}: ${error.message}`);
    }
};

/**
 * Updates an issue, commonly used for adding labels.
 * @param {string} accessToken - The user's JIRA access token.
 * @param {string} issueIdOrKey - The JIRA issue ID or key.
 * @param {object} updatePayload - The payload describing the update (e.g., { fields: { labels: ["new-label"] } } or { update: { labels: [{add: "new-label"}] } }).
 * @returns {Promise<void>} - Resolves on success.
 */
const updateIssue = async (accessToken, issueIdOrKey, updatePayload) => {
    try {
        // Use PUT for updating fields
        await jiraApi.put(`/issue/${issueIdOrKey}`, updatePayload, {
            headers: getAuthHeaders(accessToken),
        });
        // PUT usually returns 204 No Content on success
    } catch (error) {
        console.error(`JIRA API Error (updateIssue ${issueIdOrKey}):`, error.response ? error.response.data : error.message);
        throw new Error(`Failed to update JIRA issue ${issueIdOrKey}: ${error.message}`);
    }
};


module.exports = {
  searchIssues,
  getIssue,
  getIssueComments,
  addIssueComment,
  updateIssue,
}; 