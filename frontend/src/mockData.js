// frontend/src/mockData.js
const today = new Date();
const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
const threeWeeksAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 21);
const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, today.getDate());

const createIsoDate = (date) => date.toISOString();

const mockAssignees = [
  { displayName: 'person1' },
  { displayName: 'person2' },
  { displayName: 'person3' },
  null, // Unassigned
];

const mockReporters = [
  { displayName: 'QA Tester Alpha' },
  { displayName: 'Product Owner Beta' },
  { displayName: 'User Gamma' },
];

const mockStatuses = [
  'Ongoing', // Maps to Open, Assessed, Analyzed
  'Triage Pending', // Maps to RCCL_TRIAGE_PENDING label
  'Waiting', // Maps to RCCL_TRIAGE_NEED_MORE_INFO label
  'Done', // Maps to Implemented, Closed
  'Rejected', // Maps to status Rejected OR RCCL_TRIAGE_REJECTED label
  'Not RCCL Issue', // Maps to RCCL_TRIAGE_NRI label
];

const mockPriorities = ['P1', 'P2', 'P3', 'P4', 'P5']; // P3, P4, P5 will be 'Other'

const generateMockComments = (ticketKey, count = 3) => {
  const comments = [];
  for (let i = 0; i < count; i++) {
    comments.push({
      id: `${ticketKey}-comment-${i + 1}`,
      author: { displayName: mockAssignees[i % (mockAssignees.length -1)]?.displayName || 'System User' }, // Ensure assignee exists for comment
      body: `This is mock comment number ${i + 1} for ticket ${ticketKey}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      created: new Date(today.getTime() - Math.random() * 1000 * 60 * 60 * 24 * 10).toISOString(), // comments in last 10 days
      updated: new Date(today.getTime() - Math.random() * 1000 * 60 * 60 * 24 * 5).toISOString(),
    });
  }
  return comments;
};

export const mockTickets = Array.from({ length: 25 }, (_, i) => {
  const id = (10000 + i).toString();
  const key = `MOCK-${i + 1}`;
  const createdDate = new Date(twoMonthsAgo.getTime() + Math.random() * (today.getTime() - twoMonthsAgo.getTime()));
  const updatedDate = new Date(createdDate.getTime() + Math.random() * (today.getTime() - createdDate.getTime()));
  const priorityName = mockPriorities[i % mockPriorities.length];
  const statusName = mockStatuses[i % mockStatuses.length];
  const assignee = mockAssignees[i % mockAssignees.length];
  
  let labels = [];
  let jiraStatus = 'Open'; // Default JIRA status

  switch (statusName) {
    case 'Ongoing':
      labels = ['RCCL_TRIAGE_COMPLETED']; // Or can be PENDING, NEED_MORE_INFO if status is Open/Assessed/Analyzed
      jiraStatus = ['Open', 'Assessed', 'Analyzed'][i % 3];
      break;
    case 'Triage Pending':
      labels = ['RCCL_TRIAGE_PENDING'];
      jiraStatus = 'Open';
      break;
    case 'Waiting':
      labels = ['RCCL_TRIAGE_NEED_MORE_INFO'];
      jiraStatus = 'Open'; // Or some other appropriate status
      break;
    case 'Done':
      labels = ['RCCL_TRIAGE_COMPLETED'];
      jiraStatus = ['Implemented', 'Closed'][i % 2];
      break;
    case 'Rejected':
      // To cover both conditions: (specificRejectedLabel) OR (generalRcclTriageLabels AND rejectedStatus)
      if (i % 2 === 0) {
        labels = ['RCCL_TRIAGE_REJECTED']; // specificRejectedLabel
        jiraStatus = 'Resolved'; // Can be any status if this label is present
      } else {
        labels = ['RCCL_TRIAGE_COMPLETED']; // A general label
        jiraStatus = 'Rejected'; // rejectedStatus
      }
      break;
    case 'Not RCCL Issue':
      labels = ['RCCL_TRIAGE_NRI'];
      jiraStatus = 'Closed'; // Or any other status
      break;
    default:
      labels = ['RCCL_TRIAGE_COMPLETED'];
      jiraStatus = 'Open';
  }
  
  // Add some random other labels
  if (Math.random() > 0.7) labels.push('Frontend');
  if (Math.random() > 0.6) labels.push('Backend');


  return {
    id: id,
    key: key,
    fields: {
      summary: `Mock Ticket ${i + 1}: ${statusName} - ${priorityName}`,
      description: `This is a detailed description for mock ticket ${key}. It was created on ${createdDate.toLocaleDateString()} and last updated on ${updatedDate.toLocaleDateString()}. The priority is ${priorityName} and current status is effectively '${statusName}'. The JIRA status is '${jiraStatus}'.`,
      issuetype: { name: 'Defect' },
      status: { name: jiraStatus }, // This is the actual JIRA status field
      priority: { name: priorityName },
      assignee: assignee,
      reporter: mockReporters[i % mockReporters.length],
      labels: labels,
      created: createIsoDate(createdDate),
      updated: createIsoDate(updatedDate),
    },
    // Adding comments directly to the ticket object as useSidebar expects to fetch them
    // For the mock, we'll provide them directly if selectedTicketData has them.
    comments: generateMockComments(key, (i % 4) + 1), // 1 to 4 comments
  };
});

// Helper to simulate date filtering for mock data
export const filterTicketsByDate = (tickets, dateFilter, startDateStr, endDateStr) => {
  if (!dateFilter || dateFilter === 'all') return tickets;

  const now = new Date();
  let lowerBound;

  if (dateFilter === 'week') {
    lowerBound = new Date(now.setDate(now.getDate() - 7));
  } else if (dateFilter === 'month') {
    lowerBound = new Date(now.setMonth(now.getMonth() - 1));
  } else if (dateFilter === 'range' && startDateStr && endDateStr) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999); // Include the entire end day

    return tickets.filter(ticket => {
      const updated = new Date(ticket.fields.updated);
      return updated >= startDate && updated <= endDate;
    });
  } else if (dateFilter === 'range' && (!startDateStr || !endDateStr)) {
    return []; // Or tickets, depending on desired behavior for incomplete range
  } else {
    return tickets; // Should not happen if UI is correct
  }
  if (!lowerBound) return tickets; // Should only happen if dateFilter is 'all' or invalid 'range'
  lowerBound.setHours(0,0,0,0);

  return tickets.filter(ticket => {
    const updated = new Date(ticket.fields.updated);
    return updated >= lowerBound;
  });
};

// Helper to simulate assignee filtering
export const filterTicketsByAssignee = (tickets, assigneeFilter) => {
  if (!assigneeFilter || assigneeFilter === 'all') return tickets;
  // Mapping from filter key to actual displayName (or null for unassigned)
  const assigneeMap = {
    'me': 'person1',
    'avinash': 'person2',
    'marzieh': 'person3',
    'unassigned': null 
  };
  const targetDisplayName = assigneeMap[assigneeFilter];

  return tickets.filter(ticket => {
    if (targetDisplayName === null) {
      return !ticket.fields.assignee;
    }
    return ticket.fields.assignee && ticket.fields.assignee.displayName === targetDisplayName;
  });
};

// Helper to simulate JQL-like status/label filtering
export const filterTicketsByButton = (tickets, buttonFilter) => {
  if (!buttonFilter || buttonFilter === 'alltime') return tickets; // 'alltime' is the default

  return tickets.filter(ticket => {
    const labels = ticket.fields.labels || [];
    const status = ticket.fields.status ? ticket.fields.status.name : '';

    switch (buttonFilter) {
      case 'triagePending':
        return labels.includes('RCCL_TRIAGE_PENDING');
      case 'waiting':
        return labels.includes('RCCL_TRIAGE_NEED_MORE_INFO');
      case 'nri':
        return labels.includes('RCCL_TRIAGE_NRI');
      case 'rejected':
        return labels.includes('RCCL_TRIAGE_REJECTED') || (status === 'Rejected' && labels.some(l => l.startsWith('RCCL_TRIAGE_')));
      case 'ongoing':
        return ['Open', 'Assessed', 'Analyzed'].includes(status) && labels.some(l => ['RCCL_TRIAGE_COMPLETED', 'RCCL_TRIAGE_PENDING', 'RCCL_TRIAGE_NEED_MORE_INFO', 'RCCL_TRIAGE_REJECTED'].includes(l)) ;
      case 'done':
        return ['Implemented', 'Closed'].includes(status);
      default:
        return true;
    }
  });
}; 