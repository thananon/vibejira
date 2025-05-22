const jiraService = require('../services/jiraService');

// Helper to wrap async functions for Express error handling
const asyncHandler = fn => (req, res, next) =>
  Promise
    .resolve(fn(req, res, next))
    .catch(next);

// --- Controller Functions --- 

exports.getDashboardSummary = asyncHandler(async (req, res) => {
  try {
    // Extract filter parameters from query string
    const { activeButtonFilter, selectedDateFilter, startDate, endDate, activeAssigneeFilter } = req.query;

    // --- Base JQL Construction (Common filters) --- 
    const defectTypeForCards = `issuetype = Defect`;
    
    // Base labels for cards that show a mix of RCCL_TRIAGE states.
    // Adjust this list if NRI or other labels should be part of certain summary counts.
    const generalRcclTriageLabels = `labels in (RCCL_TRIAGE_COMPLETED, RCCL_TRIAGE_PENDING, RCCL_TRIAGE_NEED_MORE_INFO, RCCL_TRIAGE_REJECTED)`;

    let dateFilterJql = '';
    if (selectedDateFilter === 'week') {
      dateFilterJql = ' AND updated >= -7d'; 
    } else if (selectedDateFilter === 'month') {
      dateFilterJql = ' AND updated >= -30d';
    } else if (selectedDateFilter === 'range' && startDate && endDate) {
      dateFilterJql = ` AND updated >= "${startDate}" AND updated <= "${endDate}"`;
    }

    let assigneeFilterJql = '';
    if (activeAssigneeFilter === 'avinash') {
      assigneeFilterJql = ' AND assignee = "Potnuru, Avinash"';
    } else if (activeAssigneeFilter === 'marzieh') {
      assigneeFilterJql = ' AND assignee = "Berenjkoub, Marzieh"';
    } else if (activeAssigneeFilter === 'me') {
      assigneeFilterJql = ' AND assignee = "Patinyasakdikul, Arm"'; 
    }

    // --- Calculate Counts --- 
    // const defectTypeForCards = `issuetype = Defect`; // Already defined above

    // Define JQL queries, now independent of project and triage assignment field
    // Triage Pending card: Generally won't use the global date/assignee filters from the top bar for its specific count.
    const triagePendingJql = `${defectTypeForCards} AND labels = RCCL_TRIAGE_PENDING`;
    
    // Waiting for Info card: Similar to Triage Pending, usually specific to its label.
    const waitingForInfoJql = `${defectTypeForCards} AND labels = RCCL_TRIAGE_NEED_MORE_INFO`;

    // For In Progress, Active P1, Completed - these will use the global date/assignee filters
    const inProgressJql = `${defectTypeForCards} AND ${generalRcclTriageLabels} AND status in (Opened, Assessed, Analyzed)${assigneeFilterJql}${dateFilterJql}`;
    const activeP1Jql = `${defectTypeForCards} AND ${generalRcclTriageLabels} AND priority = "P1 (Gating)" AND status in (Opened, Assessed, Analyzed)${assigneeFilterJql}${dateFilterJql}`;
    const completedJql = `${defectTypeForCards} AND ${generalRcclTriageLabels} AND status in (Implemented, Closed)${assigneeFilterJql}${dateFilterJql}`;
    
    const specificRejectedLabelForCard = `labels = RCCL_TRIAGE_REJECTED`;
    const rejectedStatusForCard = `status = Rejected`;
    const rejectedJql = `${defectTypeForCards} AND ((${specificRejectedLabelForCard}) OR (${generalRcclTriageLabels} AND ${rejectedStatusForCard}))${assigneeFilterJql}${dateFilterJql}`;

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
      completedToday: completedCount, // Renaming key to match frontend expectation for now 
                                       // TODO: Align frontend/backend naming (e.g., use 'completed')
      rejected: rejectedCount,        // Added rejected count
      waitingForInfo: waitingForInfoCount, // Added waiting for info count
    });

  } catch (error) {
    console.error("Error fetching dashboard summary data:", error);
    res.status(500).json({ message: "Failed to fetch dashboard summary data" });
  }
});

exports.searchTickets = asyncHandler(async (req, res) => {
  const { filter, jql, fields, startAt, maxResults } = req.query;
  let searchJql = jql; // Use provided JQL if available

  // Translate simple filters to JQL if no explicit JQL is given
  if (!searchJql) {
    switch (filter) {
      case 'p1':
        searchJql = 'priority = P1 ORDER BY updated DESC';
        break;
      case 'p2':
        searchJql = 'priority = P2 ORDER BY updated DESC';
        break;
      case 'other':
        searchJql = 'priority not in (P1, P2) ORDER BY updated DESC';
        break;
      case 'myOpenIssues':
        searchJql = 'assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC';
        break;
      case 'reportedByMe':
        searchJql = 'reporter = currentUser() ORDER BY created DESC';
        break;
      case 'all':
         searchJql = 'ORDER BY updated DESC';
         break;
       case 'done':
         searchJql = 'status = Done ORDER BY resolutiondate DESC';
         break;
      default:
        searchJql = 'assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC'; 
    }
  }

  if (!searchJql) {
    return res.status(400).json({ message: 'Missing JQL query or valid filter parameter.' });
  }

  const options = { 
    fields: fields || 'summary,status,issuetype,priority,created,updated,assignee,labels,customfield_16104,customfield_15484', 
    startAt: parseInt(startAt, 10) || 0, 
    maxResults: parseInt(maxResults, 10) || 50 
  };
  
  const results = await jiraService.searchIssues(searchJql, options);

  // Temporary log to inspect customfield_15484 in fields and renderedFields
  if (results && results.issues && results.issues.length > 0) {
    console.log('Inspecting customfield_15484 for the first few tickets (fields vs renderedFields):');
    results.issues.slice(0, 3).forEach(issue => {
      console.log(`--- Ticket ${issue.key} ---`);
      if (issue.fields && issue.fields.customfield_15484) {
        console.log(`  fields.customfield_15484:`, JSON.stringify(issue.fields.customfield_15484, null, 2));
      } else {
        console.log(`  fields.customfield_15484: Not present or null.`);
      }
      if (issue.renderedFields && issue.renderedFields.customfield_15484) {
        console.log(`  renderedFields.customfield_15484:`, JSON.stringify(issue.renderedFields.customfield_15484, null, 2));
      } else {
        console.log(`  renderedFields.customfield_15484: Not present or null.`);
      }
    });
  }

  res.json(results);
});

exports.getComments = asyncHandler(async (req, res) => {
  const { issueKey } = req.params;
  const commentsData = await jiraService.getIssueComments(issueKey);
  res.json(commentsData);
});

exports.addComment = asyncHandler(async (req, res) => {
  const { issueKey } = req.params;
  const { body } = req.body;

  if (!body) {
    return res.status(400).json({ message: 'Comment body is required.' });
  }

  const newComment = await jiraService.addIssueComment(issueKey, body);
  res.status(201).json(newComment);
});

exports.addLabel = asyncHandler(async (req, res) => {
    const { issueKey } = req.params;
    const { label } = req.body;

    if (!label) {
        return res.status(400).json({ message: 'Label is required.' });
    }

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
  const { issueKey } = req.params;
  const issueData = await jiraService.getIssue(issueKey, { expand: 'changelog' });
  res.json(issueData);
});

// New function to update ticket state based on labels
exports.updateTicketState = asyncHandler(async (req, res) => {
  const { issueKey } = req.params;
  const { targetState } // Expected: 'pending', 'completed', 'moreInfo', 'rejected', 'nri'
    = req.body;

  if (!targetState) {
    return res.status(400).json({ message: 'Target state is required.' });
  }

  const labelsToRemove = [
    'RCCL_TRIAGE_PENDING',
    'RCCL_TRIAGE_COMPLETED',
    'RCCL_TRIAGE_NEED_MORE_INFO',
    'RCCL_TRIAGE_REJECTED',
    'RCCL_TRIAGE_NRI' // Add NRI to the list of labels to remove for any state change
  ];

  let labelToAdd = '';
  switch (targetState) {
    case 'pending':
      labelToAdd = 'RCCL_TRIAGE_PENDING';
      break;
    case 'completed':
      labelToAdd = 'RCCL_TRIAGE_COMPLETED';
      break;
    case 'moreInfo':
      labelToAdd = 'RCCL_TRIAGE_NEED_MORE_INFO';
      break;
    case 'rejected': // Added for potential future use
       labelToAdd = 'RCCL_TRIAGE_REJECTED';
       break;
    case 'nri': // Handle the new 'nri' state
      labelToAdd = 'RCCL_TRIAGE_NRI';
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
  const { issueKey } = req.params;
  const { fieldId, value } = req.body;

  if (!fieldId) {
    return res.status(400).json({ message: 'fieldId is required in the request body.' });
  }
  // Value can be an empty string, so we don't check for !value strictly
  if (value === undefined) { // Check if value is explicitly not provided
    return res.status(400).json({ message: 'value is required in the request body for the field.' });
  }

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