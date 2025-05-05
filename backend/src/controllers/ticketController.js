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
    const projectAndType = `project = SWDEV AND issuetype = Defect`;
    const triageAssignment = `"Triage Assignment" = "[1637333]"`;
    const baseLabels = `labels in (RCCL_TRIAGE_COMPLETED, RCCL_TRIAGE_PENDING, RCCL_TRIAGE_NEED_MORE_INFO, RCCL_TRIAGE_REJECTED)`; // Assuming this is the relevant universe for most cards

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

    // Base JQL combining project, assignment, labels, date, and assignee filters
    // Note: Triage Pending doesn't use all these base filters
    const baseFilterJql = `${projectAndType} AND ${triageAssignment} AND ${baseLabels}${assigneeFilterJql}${dateFilterJql}`;
    
    // --- Calculate Counts --- 

    // Triage Pending (Specific JQL - Ignores date/assignee/base labels filter)
    const triagePendingJql = `${projectAndType} AND ${triageAssignment} AND labels = RCCL_TRIAGE_PENDING`;
    const triagePendingResult = await jiraService.searchIssues(triagePendingJql, { maxResults: 0 });
    const triagePendingCount = triagePendingResult.total || 0;

    // In Progress (Uses base filters + status)
    const inProgressJql = `${baseFilterJql} AND status in (Opened, Assessed, Analyzed)`;
    const inProgressResult = await jiraService.searchIssues(inProgressJql, { maxResults: 0 });
    const inProgressCount = inProgressResult.total || 0;

    // Active P1 (Uses base filters + status + priority)
    // Use exact priority name, quoted because it contains spaces/parentheses
    const activeP1Jql = `${baseFilterJql} AND priority = "P1 (Gating)" AND status in (Opened, Assessed, Analyzed)`;
    const activeP1Result = await jiraService.searchIssues(activeP1Jql, { maxResults: 0 });
    const activeP1Count = activeP1Result.total || 0;

    // Completed (Uses base filters + status)
    const completedJql = `${baseFilterJql} AND status in (Implemented, Closed)`;
    const completedResult = await jiraService.searchIssues(completedJql, { maxResults: 0 });
    const completedCount = completedResult.total || 0;

    // Rejected (Uses base filters + status)
    const rejectedJql = `${baseFilterJql} AND status = Rejected`;
    const rejectedResult = await jiraService.searchIssues(rejectedJql, { maxResults: 0 });
    const rejectedCount = rejectedResult.total || 0;

    // Waiting for Info (tickets with RCCL_TRIAGE_NEED_MORE_INFO label)
    const waitingForInfoJql = `${projectAndType} AND ${triageAssignment} AND labels = RCCL_TRIAGE_NEED_MORE_INFO`;
    const waitingForInfoResult = await jiraService.searchIssues(waitingForInfoJql, { maxResults: 0 });
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
    fields: fields || 'summary,status,issuetype,priority,created,updated,assignee,labels', 
    startAt: parseInt(startAt, 10) || 0, 
    maxResults: parseInt(maxResults, 10) || 50 
  };
  
  const results = await jiraService.searchIssues(searchJql, options);
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
  const { targetState } // Expected: 'pending', 'completed', 'moreInfo', 'rejected'
    = req.body;

  if (!targetState) {
    return res.status(400).json({ message: 'Target state is required.' });
  }

  const labelsToRemove = [
    'RCCL_TRIAGE_PENDING',
    'RCCL_TRIAGE_COMPLETED',
    'RCCL_TRIAGE_NEED_MORE_INFO',
    'RCCL_TRIAGE_REJECTED'
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
     res.status(500).json({ message: `Failed to update ticket state: ${error.message}` });
  }
}); 