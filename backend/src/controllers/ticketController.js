const jiraService = require('../services/jiraService');

// Helper to wrap async functions for Express error handling
const asyncHandler = fn => (req, res, next) =>
  Promise
    .resolve(fn(req, res, next))
    .catch(next);

// --- Controller Functions --- 

exports.getDashboardSummary = asyncHandler(async (req, res) => {
  try {
    // Define the base query parts (can be adjusted based on overall dashboard scope)
    const projectAndType = `project = SWDEV AND issuetype = Defect`;
    const triageAssignment = `"Triage Assignment" = "[1637333]"`;

    // --- Triage Pending Count --- 
    const triagePendingJql = `${projectAndType} AND ${triageAssignment} AND labels = RCCL_TRIAGE_PENDING`;
    const triagePendingResult = await jiraService.searchIssues(triagePendingJql, { maxResults: 0 }); // Fetch only count
    const triagePendingCount = triagePendingResult.total || 0;

    // --- Placeholder for other counts --- 
    // TODO: Implement similar JQL searches for other cards (In Progress, Active P1, Completed Today)
    const inProgressCount = 28; // Mock
    const activeP1Count = 3;    // Mock
    const completedTodayCount = 8; // Mock

    // Return the counts
    res.json({
      triagePending: triagePendingCount,
      inProgress: inProgressCount,    
      activeP1: activeP1Count,       
      completedToday: completedTodayCount, 
    });

  } catch (error) {
    console.error("Error fetching dashboard summary data:", error);
    // Send a generic error response or re-throw for global handler
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