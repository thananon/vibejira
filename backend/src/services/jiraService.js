const axios = require('axios');
const config = require('../config');

// Flag for debug logging
const JIRA_DEBUG_ENABLED = process.env.JIRA_API_DEBUG === 'true';

// Create an axios instance pre-configured for JIRA API v2 (Cloud)
const jiraApi = axios.create({
  baseURL: `${config.jiraBaseUrl}/rest/api/2`,
  headers: {
    Authorization: `Bearer ${config.jiraPat}`,
    Accept: 'application/json',
  }
});

// --- Axios Interceptors for Debugging ---
if (JIRA_DEBUG_ENABLED) {
  console.log('JIRA API Debug Logging Enabled');

  jiraApi.interceptors.request.use(
    (request) => {
      console.log('\\n--- JIRA API Request --- \\n');
      console.log(`METHOD: ${request.method.toUpperCase()}`);
      console.log(`URL: ${request.baseURL}${request.url}`);
      if (request.params && Object.keys(request.params).length > 0) {
        console.log('PARAMS:', JSON.stringify(request.params));
      }
      if (request.data) {
        try {
           console.log('BODY:', JSON.stringify(request.data, null, 2));
        } catch (e) {
           console.log('BODY: [Could not stringify]');
        }
      }
      console.log('------------------------ \\n');
      return request;
    },
    (error) => {
      console.error('\\n--- JIRA API Request Error --- \\n', error);
      console.error('---------------------------- \\n');
      return Promise.reject(error);
    }
  );

  jiraApi.interceptors.response.use(
    (response) => {
      console.log('\\n--- JIRA API Response --- \\n');
      console.log(`STATUS: ${response.status}`);
      try {
          console.log('DATA:', JSON.stringify(response.data, null, 2));
      } catch (e) {
          console.log('DATA: [Could not stringify]');
      }
      console.log('------------------------- \\n');
      return response;
    },
    (error) => {
      console.error('\\n--- JIRA API Response Error --- \\n');
      if (error.response) {
        console.error(`STATUS: ${error.response.status}`);
        try {
            console.error('DATA:', JSON.stringify(error.response.data, null, 2));
        } catch (e) {
            console.error('DATA: [Could not stringify]');
        }
        // console.error('HEADERS:', JSON.stringify(error.response.headers, null, 2));
      } else if (error.request) {
        console.error('REQUEST MADE BUT NO RESPONSE:', error.request);
      } else {
        console.error('ERROR MESSAGE:', error.message);
      }
      console.error('----------------------------- \\n');
      return Promise.reject(error);
    }
  );
}

// --- Service Functions --- 

/**
 * Searches for JIRA issues using JQL.
 * @param {string} jql - The JIRA Query Language string.
 * @param {object} options - Optional parameters like fields, maxResults, startAt.
 * @returns {Promise<object>} - The search results from JIRA.
 */
const searchIssues = async (jql, options = {}) => {
  try {
    const params = {
      jql: jql,
      fields: options.fields || 'summary,status,issuetype,priority,created,updated,assignee,labels',
      maxResults: options.maxResults || 50,
      startAt: options.startAt || 0,
      validateQuery: 'strict',
    };
    const response = await jiraApi.get('/search', { params });
    return response.data;
  } catch (error) {
    console.error('JIRA API Error (searchIssues):', error.response ? error.response.data : error.message);
    throw new Error(`Failed to search JIRA issues: ${error.message}`);
  }
};

/**
 * Fetches details for a specific issue, optionally expanding fields like comments or changelog.
 * @param {string} issueIdOrKey - The JIRA issue ID or key (e.g., 'PROJECT-123').
 * @param {object} options - Optional parameters like fields, expand.
 * @returns {Promise<object>} - The issue details from JIRA.
 */
const getIssue = async (issueIdOrKey, options = {}) => {
  try {
    const params = {
      fields: options.fields,
      expand: options.expand,
    };
    const response = await jiraApi.get(`/issue/${issueIdOrKey}`, { params });
    return response.data;
  } catch (error) {
    console.error(`JIRA API Error (getIssue ${issueIdOrKey}):`, error.response ? error.response.data : error.message);
    throw new Error(`Failed to get JIRA issue ${issueIdOrKey}: ${error.message}`);
  }
};

/**
 * Fetches comments for a specific issue.
 * @param {string} issueIdOrKey - The JIRA issue ID or key.
 * @returns {Promise<object>} - The comments data from JIRA.
 */
const getIssueComments = async (issueIdOrKey) => {
    try {
        const response = await jiraApi.get(`/issue/${issueIdOrKey}/comment`, {
            params: {
                orderBy: '-created'
            }
        });
        return response.data;
    } catch (error) {
        console.error(`JIRA API Error (getIssueComments ${issueIdOrKey}):`, error.response ? error.response.data : error.message);
        throw new Error(`Failed to get comments for JIRA issue ${issueIdOrKey}: ${error.message}`);
    }
};

/**
 * Adds a comment to a specific issue.
 * @param {string} issueIdOrKey - The JIRA issue ID or key.
 * @param {string} commentBody - The text content of the comment.
 * @returns {Promise<object>} - The newly created comment object from JIRA.
 */
const addIssueComment = async (issueIdOrKey, commentBody) => {
    try {
        const response = await jiraApi.post(`/issue/${issueIdOrKey}/comment`, 
            { body: commentBody }
        );
        return response.data;
    } catch (error) {
        console.error(`JIRA API Error (addIssueComment ${issueIdOrKey}):`, error.response ? error.response.data : error.message);
        throw new Error(`Failed to add comment to JIRA issue ${issueIdOrKey}: ${error.message}`);
    }
};

/**
 * Updates an issue, commonly used for adding labels.
 * @param {string} issueIdOrKey - The JIRA issue ID or key.
 * @param {object} updatePayload - The payload describing the update.
 * @returns {Promise<void>} - Resolves on success.
 */
const updateIssue = async (issueIdOrKey, updatePayload) => {
    try {
        await jiraApi.put(`/issue/${issueIdOrKey}`, updatePayload);
    } catch (error) {
        console.error(`JIRA API Error (updateIssue ${issueIdOrKey}):`, error.response ? error.response.data : error.message);
        throw new Error(`Failed to update JIRA issue ${issueIdOrKey}: ${error.message}`);
    }
};

/**
 * Fetches details for the currently authenticated user (via PAT).
 * @returns {Promise<object>} - The user details object from JIRA.
 */
const getMyself = async () => {
  try {
    // This endpoint confirms the PAT is valid and retrieves user associated with it
    const response = await jiraApi.get('/myself');
    return response.data;
  } catch (error) {
    console.error('JIRA API Error (getMyself):', error.response ? error.response.data : error.message);
    // Re-throw the error so the caller knows it failed
    throw new Error(`Failed to fetch JIRA user details: ${error.message}`);
  }
};

module.exports = {
  searchIssues,
  getIssue,
  getIssueComments,
  addIssueComment,
  updateIssue,
  getMyself,
}; 