const jiraService = require('../services/jiraService');

// Helper to wrap async functions for Express error handling
const asyncHandler = fn => (req, res, next) =>
  Promise
    .resolve(fn(req, res, next))
    .catch(next);

// --- Controller Functions --- 

exports.getDashboardSummary = asyncHandler(async (req, res) => {
  // TODO: Implement logic to make multiple JQL calls for card data
  // Example JQLs:
  // - 'status = "Triage Pending" AND resolution = Unresolved'
  // - 'status = "In Progress" AND resolution = Unresolved'
  // - 'priority = P1 AND status != Done AND status != Closed'
  // - 'resolutiondate >= startOfDay()'
  
  // Placeholder response
  res.json({
    triagePending: 15, // Mock
    inProgress: 28,    // Mock
    activeP1: 3,       // Mock
    completedToday: 8, // Mock
  });
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
        // Default search if no filter or JQL provided (e.g., assigned to user)
        searchJql = 'assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC'; 
    }
  }

  if (!searchJql) {
    return res.status(400).json({ message: 'Missing JQL query or valid filter parameter.' });
  }

  const options = { 
    fields: fields || 'summary,status,issuetype,priority,created,updated,assignee', 
    startAt: parseInt(startAt, 10) || 0, 
    maxResults: parseInt(maxResults, 10) || 50 
  };
  
  const results = await jiraService.searchIssues(req.accessToken, searchJql, options);
  res.json(results);
});

exports.getComments = asyncHandler(async (req, res) => {
  const { issueKey } = req.params;
  const commentsData = await jiraService.getIssueComments(req.accessToken, issueKey);
  res.json(commentsData);
});

exports.addComment = asyncHandler(async (req, res) => {
  const { issueKey } = req.params;
  const { body } = req.body; // Expect comment body in request body

  if (!body) {
    return res.status(400).json({ message: 'Comment body is required.' });
  }

  const newComment = await jiraService.addIssueComment(req.accessToken, issueKey, body);
  res.status(201).json(newComment);
});

exports.addLabel = asyncHandler(async (req, res) => {
    const { issueKey } = req.params;
    const { label } = req.body; // Expect a single label for simplicity for now

    if (!label) {
        return res.status(400).json({ message: 'Label is required.' });
    }

    // JIRA API expects updates via specific operations
    const updatePayload = {
        update: {
            labels: [
                { add: label } 
            ]
        }
    };

    await jiraService.updateIssue(req.accessToken, issueKey, updatePayload);
    res.status(204).send(); // No content on success
});

exports.getHistory = asyncHandler(async (req, res) => {
  const { issueKey } = req.params;
  // Use the getIssue service, expanding the 'changelog' field
  const issueData = await jiraService.getIssue(req.accessToken, issueKey, { expand: 'changelog' });
  // Return the whole issue data for now, frontend can extract changelog
  res.json(issueData);
}); 