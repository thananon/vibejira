const jiraService = require('../services/jiraService');
const config = require('../config'); // To potentially access other config details if needed in future checks

// Helper to wrap async functions for Express error handling
const asyncHandler = fn => (req, res, next) =>
  Promise
    .resolve(fn(req, res, next))
    .catch(next);

exports.checkHealth = asyncHandler(async (req, res) => {
  const checks = {};
  let overallStatus = 'UP';
  let httpStatusCode = 200;

  // 1. JIRA API Sanity Check
  try {
    // Attempt to fetch basic user info as a lightweight check
    await jiraService.getMyself(); 
    checks.jira = { status: 'OK', message: 'Successfully connected to JIRA API.' };
  } catch (error) {
    overallStatus = 'DOWN';
    httpStatusCode = 503; // Service Unavailable
    checks.jira = { 
      status: 'FAIL', 
      message: 'Failed to connect to JIRA API.',
      error: error.message, // Provide a sanitized error message
      // Potentially include more details if error.response exists and is safe to expose
      details: error.response ? {
        status: error.response.status,
        data: error.response.data ? (error.response.data.errorMessages || error.response.data.errors || error.response.data) : 'No additional data from JIRA.'
      } : undefined
    };
    console.error('[HealthCheck] JIRA API check failed:', error);
  }

  // 2. Check for required environment variables (example)
  // You can expand this with other critical checks, e.g., DB connectivity
  const requiredEnvVars = ['JIRA_BASE_URL', 'JIRA_PAT', 'FRONTEND_ORIGIN'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingEnvVars.length > 0) {
    overallStatus = 'DOWN'; // Or 'DEGRADED' depending on severity
    httpStatusCode = 503;
    checks.environment = {
      status: 'FAIL',
      message: `Missing critical environment variables: ${missingEnvVars.join(', ')}`,
      missing: missingEnvVars
    };
  } else {
    checks.environment = {
      status: 'OK',
      message: 'Required environment variables are present.'
    };
  }
  
  // Add other checks here in the future (e.g., database connection)

  res.status(httpStatusCode).json({
    overallStatus: overallStatus,
    timestamp: new Date().toISOString(),
    checks: checks
  });
});
