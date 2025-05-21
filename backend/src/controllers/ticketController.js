const { validationResult } = require('express-validator');
const jiraService = require('../services/jiraService');
const constants = require('../config/jiraConstants');

// Helper to wrap async functions for Express error handling
const asyncHandler = fn => (req, res, next) =>
  Promise
    .resolve(fn(req, res, next))
    .catch(next);

// --- Controller Functions --- 

exports.getDashboardSummary = asyncHandler(async (req, res) => {
  // Validation check (from express-validator in routes)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // No need to log errors here, as the middleware in routes/tickets.js already handles it.
    // The createValidationMiddleware sends the 400 response.
    // This check is more of a safeguard or for specific logic if needed after validation,
    // but typically the middleware handles the response for validation errors.
    // For clarity, we can remove this redundant check if the middleware always responds.
    // However, if the middleware was structured to only add errors to req and let the controller decide,
    // then this check would be essential. Given the current createValidationMiddleware, this is defensive.
    return; // Stop processing if validation errors were already handled by middleware.
  }

  try {
    // Extract filter parameters from query string
    const { activeButtonFilter, selectedDateFilter, startDate, endDate, activeAssigneeFilter } = req.query;

    // --- Base JQL Construction (Common filters) --- 
    // Constants like constants.JIRA_ISSUETYPE_DEFECT and constants.JQL_GENERAL_RCCL_TRIAGE_LABELS are used directly below.

    let dateFilterJql = '';
    if (selectedDateFilter === 'week') {
      dateFilterJql = constants.JQL_UPDATED_LAST_7_DAYS;
    } else if (selectedDateFilter === 'month') {
      dateFilterJql = constants.JQL_UPDATED_LAST_30_DAYS;
    } else if (selectedDateFilter === 'range' && startDate && endDate) {
      // Note: The 'AND' is now added by constants.buildJql or implicitly when concatenating later
      dateFilterJql = `updated >= "${startDate}" AND updated <= "${endDate}"`;
    }

    let assigneeFilterJql = '';
    if (activeAssigneeFilter === 'avinash') {
      assigneeFilterJql = constants.JQL_ASSIGNEE_AVINASH;
    } else if (activeAssigneeFilter === 'marzieh') {
      assigneeFilterJql = constants.JQL_ASSIGNEE_MARZIEH;
    } else if (activeAssigneeFilter === 'me') {
      assigneeFilterJql = constants.JQL_ASSIGNEE_ARM;
    }

    // --- Calculate Counts --- 
    // Triage Pending card: Generally won't use the global date/assignee filters from the top bar for its specific count.
    const triagePendingJql = constants.buildJql([constants.JIRA_ISSUETYPE_DEFECT, constants.JQL_LABEL_TRIAGE_PENDING]);
    
    // Waiting for Info card: Similar to Triage Pending, usually specific to its label.
    const waitingForInfoJql = constants.buildJql([constants.JIRA_ISSUETYPE_DEFECT, constants.JQL_LABEL_TRIAGE_NEED_MORE_INFO]);

    // For In Progress, Active P1, Completed - these will use the global date/assignee filters
    const inProgressJql = constants.buildJql([constants.JIRA_ISSUETYPE_DEFECT, constants.JQL_GENERAL_RCCL_TRIAGE_LABELS, constants.JQL_STATUS_IN_PROGRESS, assigneeFilterJql, dateFilterJql]);
    const activeP1Jql = constants.buildJql([constants.JIRA_ISSUETYPE_DEFECT, constants.JQL_GENERAL_RCCL_TRIAGE_LABELS, constants.JQL_PRIORITY_P1_GATING, constants.JQL_STATUS_IN_PROGRESS, assigneeFilterJql, dateFilterJql]);
    const completedJql = constants.buildJql([constants.JIRA_ISSUETYPE_DEFECT, constants.JQL_GENERAL_RCCL_TRIAGE_LABELS, constants.JQL_STATUS_COMPLETED, assigneeFilterJql, dateFilterJql]);
    
    // For Rejected, we combine specific label OR general labels with rejected status
    // The constants.buildJql function handles joining these with AND. We need an OR condition here.
    const rejectedJqlBase = constants.buildJql([constants.JIRA_ISSUETYPE_DEFECT]);
    const rejectedConditions = `((${constants.JQL_LABEL_TRIAGE_REJECTED}) OR (${constants.buildJql([constants.JQL_GENERAL_RCCL_TRIAGE_LABELS, constants.JQL_STATUS_REJECTED])}))`;
    const rejectedJql = constants.buildJql([rejectedJqlBase, rejectedConditions, assigneeFilterJql, dateFilterJql]);
    
    // Execute all queries in parallel using Promise.all
    const [
      triagePendingResult,
      inProgressResult,
      activeP1Result,
      completedResult,
      rejectedResult,
      waitingForInfoResult
    ] = await Promise.all([
      jiraService.searchIssues(triagePendingJql, { maxResults: 0 }),
      jiraService.searchIssues(inProgressJql, { maxResults: 0 }),
      jiraService.searchIssues(activeP1Jql, { maxResults: 0 }),
      jiraService.searchIssues(completedJql, { maxResults: 0 }),
      jiraService.searchIssues(rejectedJql, { maxResults: 0 }),
      jiraService.searchIssues(waitingForInfoJql, { maxResults: 0 })
    ]);
    
    // Extract counts from results
    const triagePendingCount = triagePendingResult.total || 0;
    const inProgressCount = inProgressResult.total || 0;
    const activeP1Count = activeP1Result.total || 0;
    const completedCount = completedResult.total || 0;
    const rejectedCount = rejectedResult.total || 0;
    const waitingForInfoCount = waitingForInfoResult.total || 0;

    // Return the counts
    res.json({
      triagePending: triagePendingCount,
      inProgress: inProgressCount,
      activeP1: activeP1Count,
      // completedToday key renamed to completed as per TODO instruction.
      // If frontend expects 'completedToday', it will need to be updated.
      completed: completedCount, 
      rejected: rejectedCount,
      waitingForInfo: waitingForInfoCount,
    });

  } catch (error) {
    console.error("Error fetching dashboard summary data:", error);
    res.status(500).json({ message: "Failed to fetch dashboard summary data" });
  }
});

exports.searchTickets = asyncHandler(async (req, res) => {
  const { filter, jql, fields, startAt, maxResults } = req.query;
  let searchJql = jql; // Use provided JQL if available

  // Validation check (from express-validator in routes)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return; // Stop processing, response handled by validation middleware
  }

  // Translate simple filters to JQL if no explicit JQL is given
  if (!searchJql) {
    switch (filter) {
      case 'p1':
        searchJql = constants.buildJql([constants.JQL_PRIORITY_P1, constants.JQL_ORDER_BY_UPDATED_DESC]);
        break;
      case 'p2':
        searchJql = constants.buildJql([constants.JQL_PRIORITY_P2, constants.JQL_ORDER_BY_UPDATED_DESC]);
        break;
      case 'other':
        searchJql = constants.buildJql([constants.JQL_PRIORITY_NOT_P1_P2, constants.JQL_ORDER_BY_UPDATED_DESC]);
        break;
      case 'myOpenIssues':
        searchJql = constants.buildJql([constants.JQL_ASSIGNEE_CURRENT_USER, constants.JQL_STATUS_UNRESOLVED, constants.JQL_ORDER_BY_UPDATED_DESC]);
        break;
      case 'reportedByMe':
        // Assuming 'reporter = currentUser()' is common enough to not be a constant or part of a generic user JQL
        searchJql = constants.buildJql(['reporter = currentUser()', constants.JQL_ORDER_BY_CREATED_DESC]);
        break;
      case 'all':
         searchJql = constants.JQL_ORDER_BY_UPDATED_DESC; // Only ordering
         break;
       case 'done':
         searchJql = constants.buildJql([`status = ${constants.JIRA_STATUS_DONE}`, constants.JQL_ORDER_BY_RESOLUTIONDATE_DESC]);
         break;
      default:
        searchJql = constants.buildJql([constants.JQL_ASSIGNEE_CURRENT_USER, constants.JQL_STATUS_UNRESOLVED, constants.JQL_ORDER_BY_UPDATED_DESC]);
    }
  }

  if (!searchJql) {
    return res.status(400).json({ message: 'Missing JQL query or valid filter parameter.' });
  }

  const options = {
    fields: fields || constants.JIRA_DEFAULT_SEARCH_FIELDS,
    startAt: parseInt(startAt, 10) || 0,
    maxResults: parseInt(maxResults, 10) || 50
  };
  
  const results = await jiraService.searchIssues(searchJql, options);
  res.json(results);
});

exports.getComments = asyncHandler(async (req, res) => {
  // Validation check for issueKey (from express-validator in routes)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return; // Stop processing, response handled by validation middleware
  }
  const { issueKey } = req.params;
  const commentsData = await jiraService.getIssueComments(issueKey);
  res.json(commentsData);
});

exports.addComment = asyncHandler(async (req, res) => {
  // Validation check (from express-validator in routes)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return; // Stop processing, response handled by validation middleware
  }

  const { issueKey } = req.params;
  const { body } = req.body;

  // The explicit check for body is now handled by express-validator
  // if (!body) {
  //   return res.status(400).json({ message: 'Comment body is required.' });
  // }

  const newComment = await jiraService.addIssueComment(issueKey, body);
  res.status(201).json(newComment);
});

exports.addLabel = asyncHandler(async (req, res) => {
    // Validation check (from express-validator in routes)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return; // Stop processing, response handled by validation middleware
    }

    const { issueKey } = req.params;
    const { label } = req.body;

    // The explicit check for label is now handled by express-validator
    // if (!label) {
    //     return res.status(400).json({ message: 'Label is required.' });
    // }

    const updatePayload = {
        update: {
            labels: [
                { add: label } 
            ]
        }
    };

    await jiraService.updateIssue(issueKey, updatePayload);
    res.status(204).send();
});

exports.getHistory = asyncHandler(async (req, res) => {
  // Validation check for issueKey (from express-validator in routes)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return; // Stop processing, response handled by validation middleware
  }
  const { issueKey } = req.params;
  const issueData = await jiraService.getIssue(issueKey, { expand: 'changelog' });
  res.json(issueData);
});

// New function to update ticket state based on labels
exports.updateTicketState = asyncHandler(async (req, res) => {
  // Validation check (from express-validator in routes)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return; // Stop processing, response handled by validation middleware
  }

  const { issueKey } = req.params;
  const { targetState } // Expected: TICKET_STATE_PENDING, TICKET_STATE_COMPLETED, etc.
    = req.body;

  // The explicit check for targetState is now handled by express-validator
  // if (!targetState) {
  //   return res.status(400).json({ message: 'Target state is required.' });
  // }

  const labelsToRemove = [
    constants.JIRA_LABEL_TRIAGE_PENDING,
    constants.JIRA_LABEL_TRIAGE_COMPLETED,
    constants.JIRA_LABEL_TRIAGE_NEED_MORE_INFO,
    constants.JIRA_LABEL_TRIAGE_REJECTED,
    constants.JIRA_LABEL_TRIAGE_NRI, // Add NRI to the list of labels to remove for any state change
  ];

  let labelToAdd = '';
  switch (targetState) {
    case constants.TICKET_STATE_PENDING:
      labelToAdd = constants.JIRA_LABEL_TRIAGE_PENDING;
      break;
    case constants.TICKET_STATE_COMPLETED:
      labelToAdd = constants.JIRA_LABEL_TRIAGE_COMPLETED;
      break;
    case constants.TICKET_STATE_MORE_INFO:
      labelToAdd = constants.JIRA_LABEL_TRIAGE_NEED_MORE_INFO;
      break;
    case constants.TICKET_STATE_REJECTED: // Added for potential future use
      labelToAdd = constants.JIRA_LABEL_TRIAGE_REJECTED;
      break;
    case constants.TICKET_STATE_NRI: // Handle the new 'nri' state
      labelToAdd = constants.JIRA_LABEL_TRIAGE_NRI;
      break;
    default:
      return res.status(400).json({ message: 'Invalid target state.' });
  }

  try {
    // Construct the update payload to remove old labels and add the new one
    const updateOperations = labelsToRemove.map(label => ({ remove: label }));
    updateOperations.push({ add: labelToAdd });

    const updatePayload = {
      update: {
        labels: updateOperations,
      },
    };

    // Call the Jira service to update the issue
    await jiraService.updateIssue(issueKey, updatePayload);
    
    // Respond with success (no content)
    res.status(204).send();

  } catch (error) {
     // Log the error on the server
     console.error(`Failed to update state for issue ${issueKey} to ${targetState}:`, error);
     // Send a generic error response to the client
     res.status(error.response?.status || 500).json({ 
       message: `Failed to update ticket state: ${error.message}`,
       jiraError: error.response?.data?.errorMessages || error.response?.data?.errors
     });
  }
});

// Controller function to update a generic field on a ticket
exports.updateTicketField = asyncHandler(async (req, res) => {
  // Validation check (from express-validator in routes)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return; // Stop processing, response handled by validation middleware
  }

  const { issueKey } = req.params;
  const { fieldId, value } = req.body;

  // Explicit checks for fieldId and value are now handled by express-validator
  // if (!fieldId) {
  //   return res.status(400).json({ message: 'fieldId is required in the request body.' });
  // }
  // if (value === undefined) {
  //   return res.status(400).json({ message: 'value is required in the request body for the field.' });
  // }

  try {
    const updatePayload = {
      fields: {
        [fieldId]: value,
      },
    };

    await jiraService.updateIssue(issueKey, updatePayload);
    res.status(204).send(); // Successfully updated, no content to return

  } catch (error) {
    console.error(`Error updating field ${fieldId} for ticket ${issueKey}:`, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: `Failed to update field ${fieldId} for ticket ${issueKey}: ${error.message}`,
      jiraError: error.response?.data?.errorMessages || error.response?.data?.errors
    });
  }
}); 