// import { formatDistanceToNow } from 'date-fns'; // Keep if any utils need it, for now not directly used by these three

// --- Helper Function for State ---
// Moved from Dashboard.js
export const getStateFromLabels = (labels = []) => {
  if (labels.includes('RCCL_TRIAGE_NRI')) {
    return { text: 'NRI', color: 'danger' };
  }
  if (labels.includes('RCCL_TRIAGE_PENDING')) {
    return { text: 'Need Triage', color: 'warning' };
  }
  if (labels.includes('RCCL_TRIAGE_COMPLETED')) {
    return { text: 'Triaged', color: 'success' };
  }
  if (labels.includes('RCCL_TRIAGE_NEED_MORE_INFO')) {
    return { text: 'Waiting', color: 'info' };
  }
  if (labels.includes('RCCL_TRIAGE_REJECTED')) {
    return { text: 'Rejected', color: 'danger' };
  }
  return { text: 'Unknown', color: 'secondary' }; // Default/fallback state
};

// --- Helper Function for Status Color ---
// Moved from Dashboard.js
export const getStatusColor = (statusName = '') => {
  const upperCaseStatus = statusName.toUpperCase();
  if (upperCaseStatus === 'REJECTED') return 'danger';
  if (upperCaseStatus === 'OPENED') return 'warning';
  if (upperCaseStatus === 'ASSESSED') return 'warning';
  if (upperCaseStatus === 'ANALYZED') return 'success';
  if (upperCaseStatus === 'IMPLEMENTED' || upperCaseStatus === 'CLOSED') return 'primary';
  return 'secondary'; // Default color
};

// --- Data Filtering (Priority) ---
// Helper to categorize priority for section filtering
// Moved from Dashboard.js
export const getPriorityCategory = (ticket) => {
  const priorityName = ticket?.fields?.priority?.name?.toUpperCase();
  if (!priorityName) return 'Other'; // Handle undefined/null priority

  if (priorityName.startsWith('P1')) return 'P1';
  if (priorityName.startsWith('P2')) return 'P2';
  // Treat P3, P4, and anything else as 'Other' for sectioning
  return 'Other';
};

// Note: sortData function is more complex due to its useCallback nature and dependencies.
// It will be handled within the useJiraTickets hook or refactored separately.
// formatDistanceToNow is used in Dashboard.js directly for now. 