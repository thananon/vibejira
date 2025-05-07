import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButtonGroup,
  COffcanvas,
  COffcanvasHeader,
  COffcanvasTitle,
  CCloseButton,
  COffcanvasBody,
  CCollapse,
  CRow,
  CCol,
  CFormLabel,
  CSpinner,
  CBadge,
  CAlert,
  CFormTextarea,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilCommentBubble,
  cilReload,
  cilChevronBottom,
  cilChevronTop,
  cilWarning,
  cilLoopCircular,
  cilFire,
  cilCheckCircle,
  cilArrowTop,
  cilArrowBottom,
  cilXCircle,
  cilInfo,
} from '@coreui/icons';
import { formatDistanceToNow } from 'date-fns';

// Base URL for the backend API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
// Removed JIRA_BROWSE_URL constant reading from process.env
// const JIRA_BROWSE_URL = process.env.REACT_APP_JIRA_BASE_URL || '#'; 

const Dashboard = () => {
  // State for fetched tickets, loading, and error
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for sidebar
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedTicketKey, setSelectedTicketKey] = useState(null);
  const [selectedTicketData, setSelectedTicketData] = useState(null);
  const [selectedTicketComments, setSelectedTicketComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState(null);

  // State for Summary Cards
  const [summaryData, setSummaryData] = useState({ triagePending: '-', inProgress: '-', activeP1: '-', waitingForInfo: '-', completedToday: '-', rejected: '-' });
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  // State for collapsible sections
  const [p1Visible, setP1Visible] = useState(true);
  const [p2Visible, setP2Visible] = useState(true);
  const [otherVisible, setOtherVisible] = useState(true);

  // State for date filtering - Set default to 'week'
  const [selectedDateFilter, setSelectedDateFilter] = useState('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State for main button filtering - Set default to 'ongoing'
  const [activeButtonFilter, setActiveButtonFilter] = useState('ongoing'); // 'ongoing', 'triagePending', 'waiting', 'done', 'rejected'

  // State for Jira Base URL fetched from backend
  const [jiraConfigUrl, setJiraConfigUrl] = useState('');

  // State for Assignee Filtering
  const [activeAssigneeFilter, setActiveAssigneeFilter] = useState(null); // null for All, or specific name key

  // State for Table Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'fields.updated', direction: 'descending' });

  // State for Sidebar Actions
  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const [updateStateError, setUpdateStateError] = useState(null);
  const [updateStateSuccess, setUpdateStateSuccess] = useState(false);

  // State for Adding Comment
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [addCommentError, setAddCommentError] = useState(null);
  const [addCommentSuccess, setAddCommentSuccess] = useState(false);

  // --- Fetch Config --- 
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/config`);
        if (!response.ok) {
          throw new Error('Failed to fetch config');
        }
        const configData = await response.json();
        if (configData.jiraBaseUrl) {
          setJiraConfigUrl(configData.jiraBaseUrl);
          console.log('Fetched JIRA Base URL:', configData.jiraBaseUrl);
        } else {
           console.warn('JIRA Base URL not found in backend config.');
           setJiraConfigUrl('#'); // Set to fallback if not provided
        }
      } catch (err) {
        console.error('Error fetching config:', err);
        setJiraConfigUrl('#'); // Set to fallback on error
      }
    };
    fetchConfig();
  }, []); // Run once on mount

  // --- Fetch Summary Data --- 
  useEffect(() => {
    const fetchSummary = async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        // Build query params from state
        const params = new URLSearchParams();
        if (activeButtonFilter) params.append('activeButtonFilter', activeButtonFilter);
        if (selectedDateFilter) params.append('selectedDateFilter', selectedDateFilter);
        if (activeAssigneeFilter) params.append('activeAssigneeFilter', activeAssigneeFilter);
        if (selectedDateFilter === 'range' && startDate) params.append('startDate', startDate);
        if (selectedDateFilter === 'range' && endDate) params.append('endDate', endDate);
        
        const queryString = params.toString();
        const url = `${API_BASE_URL}/api/tickets/summary${queryString ? '?' + queryString : ''}`;
        
        console.log(`Fetching summary data from: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to fetch summary'}`);
        }
        const data = await response.json();
        console.log('Fetched summary data:', data);
        setSummaryData({ 
            triagePending: data.triagePending ?? '-',
            inProgress: data.inProgress ?? '-',
            activeP1: data.activeP1 ?? '-',
            waitingForInfo: data.waitingForInfo ?? '-',
            completedToday: data.completedToday ?? '-',
            rejected: data.rejected ?? '-',
        });
      } catch (err) {
        console.error('Fetch summary error:', err);
        setSummaryError(err.message);
      } finally {
        setSummaryLoading(false);
      }
    };
    
    // Don't fetch summary if range is selected but dates are incomplete
    if (selectedDateFilter === 'range' && (!startDate || !endDate)) {
      console.log("Range selected for summary, waiting for both dates.");
      // Optionally reset summary data or show placeholders
      // setSummaryData({ triagePending: '-', inProgress: '-', activeP1: '-', completedToday: '-' });
      setSummaryLoading(false); // Prevent infinite loading state
    } else {
        fetchSummary();
    }

  }, [activeButtonFilter, selectedDateFilter, startDate, endDate, activeAssigneeFilter]); // Add all relevant filters as dependencies

  // --- Fetch Tickets --- 
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Base JQL parts removed
      // const projectAndType = `project = SWDEV AND issuetype = Defect`;
      // const triageAssignment = `"Triage Assignment" = "[1637333]"`;
      const defectType = `issuetype = Defect`; // Retain issuetype = Defect

      let finalJql = '';

      if (activeButtonFilter === 'triagePending') {
         finalJql = `${defectType} AND labels = RCCL_TRIAGE_PENDING ORDER BY updated DESC`;
      } else if (activeButtonFilter === 'waiting') {
         finalJql = `${defectType} AND labels = RCCL_TRIAGE_NEED_MORE_INFO ORDER BY updated DESC`;
      } else if (activeButtonFilter === 'nri') {
        // For 'nri', query specifically for the RCCL_TRIAGE_NRI label
        // It will respect date and assignee filters, but not a specific status filter from this block
        let dateFilterJql = '';
        if (selectedDateFilter === 'week') {
          dateFilterJql = ' AND updated >= -7d'; 
        } else if (selectedDateFilter === 'month') {
          dateFilterJql = ' AND updated >= -30d';
        } else if (selectedDateFilter === 'range' && startDate && endDate) {
          dateFilterJql = ` AND updated >= "${startDate}" AND updated <= "${endDate}"`;
        } else if (selectedDateFilter === 'range' && (!startDate || !endDate)) {
           console.log("Range selected for NRI ticket list, waiting for both dates.");
           setLoading(false); 
           return;
        }

        let assigneeFilterJql = '';
        if (activeAssigneeFilter === 'avinash') {
          assigneeFilterJql = ' AND assignee = "Potnuru, Avinash"';
        } else if (activeAssigneeFilter === 'marzieh') {
          assigneeFilterJql = ' AND assignee = "Berenjkoub, Marzieh"';
        } else if (activeAssigneeFilter === 'me') {
          assigneeFilterJql = ' AND assignee = "Patinyasakdikul, Arm"'; 
        }
        finalJql = `${defectType} AND labels = RCCL_TRIAGE_NRI${assigneeFilterJql}${dateFilterJql} ORDER BY updated DESC`;
      } else {
        // Logic for 'ongoing', 'done', and 'rejected' filters
        // Base set of labels for general view, can be overridden by specific filters like 'rejected' or 'ongoing'
        let currentLabels = `labels in (RCCL_TRIAGE_COMPLETED, RCCL_TRIAGE_PENDING, RCCL_TRIAGE_NEED_MORE_INFO, RCCL_TRIAGE_REJECTED, RCCL_TRIAGE_NRI)`; 

        let statusFilterJql = '';
        if (activeButtonFilter === 'ongoing') {
          statusFilterJql = ' AND status in (Opened, Assessed, Analyzed)';
          // For 'ongoing', explicitly exclude NRI from the default set of labels
          currentLabels = `labels in (RCCL_TRIAGE_COMPLETED, RCCL_TRIAGE_PENDING, RCCL_TRIAGE_NEED_MORE_INFO, RCCL_TRIAGE_REJECTED)`;
        } else if (activeButtonFilter === 'done') {
          statusFilterJql = ' AND status in (Implemented, Closed)'; 
        } else if (activeButtonFilter === 'rejected') {
          // For rejected, we specifically query for the RCCL_TRIAGE_REJECTED label and JIRA status Rejected
          currentLabels = `labels = RCCL_TRIAGE_REJECTED`;
          statusFilterJql = ' AND status = Rejected';
        }

        let dateFilterJql = '';
        if (selectedDateFilter === 'week') {
          dateFilterJql = ' AND updated >= -7d'; 
        } else if (selectedDateFilter === 'month') {
          dateFilterJql = ' AND updated >= -30d';
        } else if (selectedDateFilter === 'range' && startDate && endDate) {
          dateFilterJql = ` AND updated >= "${startDate}" AND updated <= "${endDate}"`;
        } else if (selectedDateFilter === 'range' && (!startDate || !endDate)) {
           console.log("Range selected for ticket list, waiting for both dates.");
           setLoading(false); 
           return; // Don't fetch if range is incomplete
        }

        let assigneeFilterJql = '';
        if (activeAssigneeFilter === 'avinash') {
          assigneeFilterJql = ' AND assignee = "Potnuru, Avinash"';
        } else if (activeAssigneeFilter === 'marzieh') {
          assigneeFilterJql = ' AND assignee = "Berenjkoub, Marzieh"';
        } else if (activeAssigneeFilter === 'me') {
          assigneeFilterJql = ' AND assignee = "Patinyasakdikul, Arm"'; 
        }
        
        // Construct final JQL. All filters now start with defectType and currentLabels
        finalJql = `${defectType} AND ${currentLabels}${statusFilterJql}${assigneeFilterJql}${dateFilterJql} ORDER BY updated DESC`;
      }

      const encodedJql = encodeURIComponent(finalJql);
      const url = `${API_BASE_URL}/api/tickets?jql=${encodedJql}&maxResults=100`; 

      console.log(`Fetching tickets with JQL: ${finalJql}`); 
      console.log(`Fetching tickets from URL: ${url}`);

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to fetch tickets'}`);
      }
      const data = await response.json();
      console.log('Fetched data:', data);

      if (data && Array.isArray(data.issues)) {
        setTickets(data.issues); 
      } else {
        console.error('Unexpected API response structure:', data);
        throw new Error('Received unexpected data structure from API.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      setTickets([]); 
    } finally {
      setLoading(false);
    }
  }, [selectedDateFilter, startDate, endDate, activeButtonFilter, activeAssigneeFilter]); // Keep dependencies

  // useEffect to call fetchTickets
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]); // Now depends on the stable callback

  // --- Fetch Comments --- 
  const fetchComments = async (issueKey) => {
    if (!issueKey) return;
    setCommentLoading(true);
    setCommentError(null);
    setSelectedTicketComments([]); // Clear previous comments
    try {
      const url = `${API_BASE_URL}/api/tickets/${issueKey}/comments`;
      console.log(`Fetching comments from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to fetch comments'}`);
      }
      const data = await response.json();
      console.log('Fetched comments data:', data);
      if (data && Array.isArray(data.comments)) {
        setSelectedTicketComments(data.comments);
      } else {
         console.error('Unexpected comments API response structure:', data);
         throw new Error('Received unexpected comments structure from API.');
      }
    } catch (err) {
      console.error('Fetch comments error:', err);
      setCommentError(err.message);
      setSelectedTicketComments([]); // Ensure comments are cleared on error
    } finally {
      setCommentLoading(false);
    }
  };

  // --- Helper Function for State --- 
  const getStateFromLabels = useCallback((labels = []) => {
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
  }, []);

  // --- Helper Function for Status Color --- 
  const getStatusColor = (statusName = '') => {
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
  const getPriorityCategory = (ticket) => {
    const priorityName = ticket?.fields?.priority?.name?.toUpperCase();
    if (!priorityName) return 'Other'; // Handle undefined/null priority

    if (priorityName.startsWith('P1')) return 'P1';
    if (priorityName.startsWith('P2')) return 'P2';
    // Treat P3, P4, and anything else as 'Other' for sectioning
    return 'Other'; 
  };

  // Filter tickets into sections based on the category
  const p1Tickets = tickets.filter(ticket => getPriorityCategory(ticket) === 'P1');
  const p2Tickets = tickets.filter(ticket => getPriorityCategory(ticket) === 'P2');
  const otherTickets = tickets.filter(ticket => getPriorityCategory(ticket) === 'Other');

  // --- Sorting Logic using useMemo --- 
  const sortData = useCallback((items, config) => {
    const sortedItems = [...items]; 
    if (config.key !== null) {
      sortedItems.sort((a, b) => {
        const getNestedValue = (obj, key) => key.split('.').reduce((o, k) => (o || {})[k], obj);
        
        let aValue, bValue;

        // Handle state sorting based on derived text
        if (config.key === 'state') {
          aValue = getStateFromLabels(getNestedValue(a, 'fields.labels')).text;
          bValue = getStateFromLabels(getNestedValue(b, 'fields.labels')).text;
        } 
        // Handle date sorting
        else if (config.key === 'fields.created' || config.key === 'fields.updated') {
          aValue = getNestedValue(a, config.key);
          bValue = getNestedValue(b, config.key);
          aValue = aValue ? new Date(aValue).getTime() : null;
          bValue = bValue ? new Date(bValue).getTime() : null;
        } 
        // Default: Get nested value directly
        else {
            aValue = getNestedValue(a, config.key);
            bValue = getNestedValue(b, config.key);
        }

        // Handle null/undefined consistently
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        // Actual comparison (case-insensitive for strings)
        const compareResult = typeof aValue === 'string' && typeof bValue === 'string'
          ? aValue.localeCompare(bValue, undefined, { sensitivity: 'base' })
          : (aValue < bValue ? -1 : (aValue > bValue ? 1 : 0));

        return config.direction === 'ascending' ? compareResult : -compareResult;
      });
    }
    return sortedItems;
  }, [getStateFromLabels]);

  const sortedP1Tickets = useMemo(() => sortData(p1Tickets, sortConfig), [p1Tickets, sortConfig, sortData]);
  const sortedP2Tickets = useMemo(() => sortData(p2Tickets, sortConfig), [p2Tickets, sortConfig, sortData]);
  const sortedOtherTickets = useMemo(() => sortData(otherTickets, sortConfig), [otherTickets, sortConfig, sortData]);

  // --- Event Handlers --- 
  const handleRowClick = (ticket) => {
    setSelectedTicketKey(ticket.key); 
    setSelectedTicketData(ticket);
    setSidebarVisible(true);
    // Fetch comments when row is clicked
    fetchComments(ticket.key);
  };

  // Event Handlers for Date Filters
  const handleDateFilterClick = (filterType) => {
    setSelectedDateFilter(filterType);
    // No explicit fetch needed here, useEffect handles it
    if (filterType !== 'range') {
        setStartDate('');
        setEndDate('');
    }
  };

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
     // No explicit fetch needed here, useEffect handles it when endDate also changes (or if already set)
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
     // No explicit fetch needed here, useEffect handles it when startDate also changes (or if already set)
  };

  // Event Handler for Main Filter Buttons
  const handleMainFilterClick = (filterType) => {
    setActiveButtonFilter(filterType);
    // Fetching is handled by useEffect due to state change
  };

  // Event Handler for Assignee Filter Buttons
  const handleAssigneeFilterClick = (filterKey) => { // filterKey: null, 'avinash', 'marzieh', 'me'
    setActiveAssigneeFilter(filterKey);
  };

  // Event Handler for Sorting
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // --- Handler for State Update --- 
  const handleUpdateTicketState = async (newState) => {
    if (!selectedTicketKey) return;

    setIsUpdatingState(true);
    setUpdateStateError(null);
    setUpdateStateSuccess(false);

    try {
      const url = `${API_BASE_URL}/api/tickets/${selectedTicketKey}/state`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetState: newState }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to update state'}`);
      }
      
      setUpdateStateSuccess(true);
      // Refresh data after successful update
      fetchTickets(); // Re-fetch the main ticket list
      fetchComments(selectedTicketKey); // Re-fetch comments for the current ticket
      // Optionally close sidebar or provide visual feedback
       setTimeout(() => setUpdateStateSuccess(false), 3000); // Hide success message after 3s

    } catch (err) {
      console.error(`Error updating state to ${newState}:`, err);
      setUpdateStateError(err.message);
       setTimeout(() => setUpdateStateError(null), 5000); // Hide error message after 5s
    } finally {
      setIsUpdatingState(false);
    }
  };

  // --- Handler for Adding Comment --- 
  const handleAddComment = async () => {
    if (!selectedTicketKey || !newComment.trim()) return;

    setIsAddingComment(true);
    setAddCommentError(null);
    setAddCommentSuccess(false);

    try {
      const url = `${API_BASE_URL}/api/tickets/${selectedTicketKey}/comments`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // JIRA API expects the comment body in a specific structure
        // Assuming your backend handles the transformation if necessary,
        // or expects a simple string like this:
        body: JSON.stringify({ body: newComment }), 
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to add comment'}`);
      }
      
      setAddCommentSuccess(true);
      setNewComment(''); // Clear the input field
      setShowCommentInput(false); // Hide input after success
      fetchComments(selectedTicketKey); // Refresh comments list
      // Optionally: Refresh main ticket list if comment affects state/sorting
      // fetchTickets(); 
       setTimeout(() => setAddCommentSuccess(false), 3000); // Hide success message after 3s

    } catch (err) {
      console.error(`Error adding comment:`, err);
      setAddCommentError(err.message);
       setTimeout(() => setAddCommentError(null), 5000); // Hide error message after 5s
    } finally {
      setIsAddingComment(false);
    }
  };

  // --- Render Functions --- 
  const renderTable = (data, title, isVisible, toggleVisibility) => {
    // Use jiraConfigUrl state variable here
    // Helper to render sort icon
    const SortIcon = ({ columnKey }) => {
      if (sortConfig.key !== columnKey) {
        return null; // No icon if not the sorted column
      }
      return sortConfig.direction === 'ascending' ? <CIcon icon={cilArrowTop} /> : <CIcon icon={cilArrowBottom} />;
    };

    return (
      <div className="mb-4">
        <h4 onClick={toggleVisibility} style={{ cursor: 'pointer' }} className="d-flex justify-content-between align-items-center">
          {title} ({data.length})
          <CIcon icon={isVisible ? cilChevronBottom : cilChevronTop} />
        </h4>
        <CCollapse visible={isVisible}>
          {data.length > 0 ? (
            <CTable hover responsive bordered small className="mt-2">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell scope="col" onClick={() => requestSort('key')} style={{ cursor: 'pointer' }}>
                     Key <SortIcon columnKey="key" />
                  </CTableHeaderCell>
                  <CTableHeaderCell scope="col" onClick={() => requestSort('fields.summary')} style={{ cursor: 'pointer' }}>
                     Summary <SortIcon columnKey="fields.summary" />
                  </CTableHeaderCell>
                  <CTableHeaderCell scope="col" onClick={() => requestSort('state')} style={{ cursor: 'pointer' }}>
                     State <SortIcon columnKey="state" />
                  </CTableHeaderCell> 
                  <CTableHeaderCell scope="col" onClick={() => requestSort('fields.status.name')} style={{ cursor: 'pointer' }}>
                     Status <SortIcon columnKey="fields.status.name" />
                  </CTableHeaderCell> 
                  <CTableHeaderCell scope="col" onClick={() => requestSort('fields.assignee.displayName')} style={{ cursor: 'pointer' }}>
                     Assignee <SortIcon columnKey="fields.assignee.displayName" />
                  </CTableHeaderCell> 
                  <CTableHeaderCell scope="col" onClick={() => requestSort('fields.updated')} style={{ cursor: 'pointer' }}>
                     Updated <SortIcon columnKey="fields.updated" />
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {data.map((ticket) => {
                  const stateInfo = getStateFromLabels(ticket.fields?.labels);
                  const statusName = ticket.fields?.status?.name || '';
                  const statusColor = getStatusColor(statusName);

                  return (
                    <CTableRow key={ticket.id} onClick={() => handleRowClick(ticket)} style={{ cursor: 'pointer' }}>
                      <CTableDataCell>
                        <a 
                          href={jiraConfigUrl && jiraConfigUrl !== '#' ? `${jiraConfigUrl}/browse/${ticket.key}` : '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => {
                             if (!jiraConfigUrl || jiraConfigUrl === '#') e.preventDefault();
                             e.stopPropagation();
                          }}
                          style={{ pointerEvents: (!jiraConfigUrl || jiraConfigUrl === '#') ? 'none' : 'auto', color: (!jiraConfigUrl || jiraConfigUrl === '#') ? 'inherit' : undefined }}
                        >
                          {ticket.key}
                        </a>
                      </CTableDataCell>
                      <CTableDataCell>{ticket.fields?.summary}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={stateInfo.color}>{stateInfo.text}</CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={statusColor}>{statusName || 'Unknown'}</CBadge>
                      </CTableDataCell>
                      <CTableDataCell>{ticket.fields?.assignee?.displayName || 'Unassigned'}</CTableDataCell>
                      <CTableDataCell>
                        {ticket.fields?.updated ? formatDistanceToNow(new Date(ticket.fields.updated), { addSuffix: true }) : ''}
                      </CTableDataCell>
                    </CTableRow>
                  );
                })}
              </CTableBody>
            </CTable>
          ) : (
            <p className="text-muted mt-2">No tickets in this section.</p>
          )}
        </CCollapse>
      </div>
    );
  };

  // --- Main Render --- 
  return (
    <>
      <CCard>
        <CCardHeader>
          JIRA Ticket Dashboard (Project: SWDEV)
        </CCardHeader>
        <CCardBody>
          {/* Main Filter Buttons */}
          <div className="mb-3">
            <CButtonGroup role="group" aria-label="Main Ticket Filter Buttons">
              <CButton 
                color="primary" 
                variant={activeButtonFilter === 'ongoing' ? undefined : 'outline'}
                onClick={() => handleMainFilterClick('ongoing')}
              >
                Ongoing Issues
              </CButton>
              <CButton 
                color="warning" 
                variant={activeButtonFilter === 'triagePending' ? undefined : 'outline'}
                onClick={() => handleMainFilterClick('triagePending')}
              >
                Triage Pending
              </CButton>
              <CButton 
                color="info" 
                variant={activeButtonFilter === 'waiting' ? undefined : 'outline'}
                onClick={() => handleMainFilterClick('waiting')}
              >
                Waiting
              </CButton>
              <CButton 
                color="success" 
                variant={activeButtonFilter === 'done' ? undefined : 'outline'}
                onClick={() => handleMainFilterClick('done')}
              >
                Done
              </CButton>
              <CButton 
                color="danger" 
                variant={activeButtonFilter === 'rejected' ? undefined : 'outline'}
                onClick={() => handleMainFilterClick('rejected')}
              >
                Rejected
              </CButton>
              <CButton 
                color="danger"
                variant={activeButtonFilter === 'nri' ? undefined : 'outline'}
                onClick={() => handleMainFilterClick('nri')}
              >
                Not RCCL Issue
              </CButton>
            </CButtonGroup>
          </div>

          {/* Date Filter Buttons - Conditionally hide if Triage Pending selected */}
          {activeButtonFilter !== 'triagePending' && activeButtonFilter !== 'waiting' && (
            <div className="mb-3">
              <span className="me-2">Filter by Updated Date:</span>
              <CButtonGroup role="group" aria-label="Date Filter Buttons">
                <CButton 
                  color="info" 
                  variant={selectedDateFilter === 'week' ? 'outline' : undefined} 
                  onClick={() => handleDateFilterClick('week')}
                >
                  Last Week
                </CButton>
                <CButton 
                  color="info" 
                  variant={selectedDateFilter === 'month' ? 'outline' : undefined}
                  onClick={() => handleDateFilterClick('month')}
                >
                  Last Month
                </CButton>
                <CButton 
                  color="info" 
                  variant={selectedDateFilter === 'all' ? 'outline' : undefined}
                  onClick={() => handleDateFilterClick('all')}
                >
                  All Time
                </CButton>
                <CButton 
                  color="info" 
                  variant={selectedDateFilter === 'range' ? 'outline' : undefined}
                  onClick={() => handleDateFilterClick('range')}
                >
                  Range
                </CButton>
              </CButtonGroup>
            </div>
          )}

          {/* Assignee Filter Buttons - Conditionally hide if Triage Pending selected */}
          {activeButtonFilter !== 'triagePending' && activeButtonFilter !== 'waiting' && (
            <div className="mb-3">
              <span className="me-2">Filter by Assignee:</span>
              <CButtonGroup role="group" aria-label="Assignee Filter Buttons">
                <CButton 
                  color="secondary" 
                  variant={activeAssigneeFilter === null ? undefined : 'outline'} 
                  onClick={() => handleAssigneeFilterClick(null)}
                >
                  All Assignees
                </CButton>
                <CButton 
                  color="secondary" 
                  variant={activeAssigneeFilter === 'avinash' ? undefined : 'outline'} 
                  onClick={() => handleAssigneeFilterClick('avinash')}
                >
                  Avinash
                </CButton>
                <CButton 
                  color="secondary" 
                  variant={activeAssigneeFilter === 'marzieh' ? undefined : 'outline'} 
                  onClick={() => handleAssigneeFilterClick('marzieh')}
                >
                  Marzieh
                </CButton>
                <CButton 
                  color="secondary" 
                  variant={activeAssigneeFilter === 'me' ? undefined : 'outline'} 
                  onClick={() => handleAssigneeFilterClick('me')}
                >
                  Me
                </CButton>
              </CButtonGroup>
            </div>
          )}

           {/* Conditional Date Range Inputs - Conditionally hide if Triage Pending selected */} 
           {activeButtonFilter !== 'triagePending' && activeButtonFilter !== 'waiting' && selectedDateFilter === 'range' && (
             <CRow className="mb-3 align-items-end">
                <CCol md={3}>
                   <CFormLabel htmlFor="startDate">From Date:</CFormLabel>
                   <input 
                     type="date" 
                     id="startDate" 
                     className="form-control"
                     value={startDate} 
                     onChange={handleStartDateChange} 
                   />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="endDate">To Date:</CFormLabel>
                  <input 
                    type="date" 
                    id="endDate" 
                    className="form-control"
                    value={endDate} 
                    onChange={handleEndDateChange} 
                  />
                </CCol>
             </CRow>
           )}

          {/* Summary Cards Row */}
          {summaryLoading && <p>Loading summary...</p>}
          {summaryError && <p className="text-danger">Error loading summary: {summaryError}</p>}
          {!summaryLoading && !summaryError && (
            <CRow className="mb-4 text-center">
              <CCol sm={6} lg={2} className="mb-3 mb-lg-0">
                <CCard textColor="warning">
                  <CCardBody>
                    <CIcon icon={cilWarning} size="xl" className="mb-2" />
                    <div>Triage Pending</div>
                    <div className="fs-2 fw-semibold">{summaryData.triagePending}</div> 
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol sm={6} lg={2} className="mb-3 mb-lg-0">
                <CCard textColor="info">
                  <CCardBody>
                    <CIcon icon={cilLoopCircular} size="xl" className="mb-2" />
                    <div>In Progress</div>
                    <div className="fs-2 fw-semibold">{summaryData.inProgress}</div>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol sm={6} lg={2} className="mb-3 mb-lg-0">
                <CCard textColor="danger">
                  <CCardBody>
                    <CIcon icon={cilFire} size="xl" className="mb-2" />
                    <div>Active P1</div>
                    <div className="fs-2 fw-semibold">{summaryData.activeP1}</div>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol sm={6} lg={2} className="mb-3 mb-lg-0">
                <CCard textColor="info">
                  <CCardBody>
                    <CIcon icon={cilInfo} size="xl" className="mb-2" />
                    <div>Waiting for Info</div>
                    <div className="fs-2 fw-semibold">{summaryData.waitingForInfo}</div>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol sm={6} lg={2} className="mb-3 mb-lg-0">
                <CCard textColor="success">
                  <CCardBody>
                    <CIcon icon={cilCheckCircle} size="xl" className="mb-2" />
                    <div>Completed</div>
                    <div className="fs-2 fw-semibold">{summaryData.completedToday}</div>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol sm={6} lg={2} className="mb-3 mb-lg-0">
                <CCard textColor="danger">
                  <CCardBody>
                    <CIcon icon={cilXCircle} size="xl" className="mb-2" />
                    <div>Rejected</div>
                    <div className="fs-2 fw-semibold">{summaryData.rejected}</div>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          )}

          {/* Ticket Tables Section - Pass sorted data */}
          {loading && <p>Loading tickets...</p>}
          {error && <p style={{ color: 'red' }}>Error fetching tickets: {error}</p>}
          {!loading && !error && (
            <>
              {renderTable(sortedP1Tickets, 'P1 Tickets', p1Visible, () => setP1Visible(!p1Visible))}
              {renderTable(sortedP2Tickets, 'P2 Tickets', p2Visible, () => setP2Visible(!p2Visible))}
              {renderTable(sortedOtherTickets, 'Other Tickets', otherVisible, () => setOtherVisible(!otherVisible))}
            </>
          )}

        </CCardBody>
      </CCard>

      <COffcanvas placement="end" visible={sidebarVisible} onHide={() => setSidebarVisible(false)} style={{ width: '600px' }}>
        <COffcanvasHeader>
          <COffcanvasTitle>Details for {selectedTicketKey}</COffcanvasTitle>
          <CCloseButton className="text-reset" onClick={() => setSidebarVisible(false)} />
        </COffcanvasHeader>
        <COffcanvasBody>
          {selectedTicketData?.fields?.created && (
            <p className="text-muted mb-2">
              Created: {formatDistanceToNow(new Date(selectedTicketData.fields.created), { addSuffix: true })}
            </p>
          )}
          
          {/* Action Buttons */}
          <div className="mb-3 d-flex flex-wrap gap-2"> {/* Use flex-wrap and gap */}
            {/* Add Comment Toggle Button */}
             <CButton 
               color="primary" 
               className="me-2" 
               onClick={() => setShowCommentInput(!showCommentInput)}
             > 
                <CIcon icon={cilCommentBubble} className="me-1"/> Add Comment
              </CButton>
            
            {/* State Change Buttons */}
            <CButton 
              color="warning" 
              onClick={() => handleUpdateTicketState('pending')}
              disabled={isUpdatingState}
            >
              <CIcon icon={cilWarning} className="me-1" /> Send to Triage
            </CButton>
            <CButton 
              color="success" 
              onClick={() => handleUpdateTicketState('completed')}
              disabled={isUpdatingState}
            >
              <CIcon icon={cilCheckCircle} className="me-1" /> Triage Complete
            </CButton>
             <CButton 
              color="info" 
              onClick={() => handleUpdateTicketState('moreInfo')}
              disabled={isUpdatingState}
            >
              <CIcon icon={cilInfo} className="me-1" /> More Info Needed
            </CButton>
            <CButton
              color="danger"
              onClick={() => handleUpdateTicketState('nri')}
              disabled={isUpdatingState}
            >
              Not RCCL Issue
            </CButton>
            {/* Add Reject button if needed later */}
            {/* <CButton color="danger" onClick={() => handleUpdateTicketState('rejected')} disabled={isUpdatingState}><CIcon icon={cilBan} className="me-1" /> Reject</CButton> */}

            {/* Go to Ticket Button */}
            <CButton
              color="secondary"
              href={jiraConfigUrl && jiraConfigUrl !== '#' && selectedTicketKey ? `${jiraConfigUrl}/browse/${selectedTicketKey}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              disabled={!jiraConfigUrl || jiraConfigUrl === '#' || !selectedTicketKey}
              component="a" // Use component="a" for CoreUI button to act as a link
            >
              Go to ticket
            </CButton>

            {/* TODO: Implement Refresh */} 
            <CButton color="light" disabled>
              <CIcon icon={cilReload} className="me-1" /> Refresh
            </CButton>
          </div>

          {/* Conditional Comment Input Area */}
          {showCommentInput && (
            <div className="mt-3 border-top pt-3">
              <CFormTextarea
                rows={3}
                placeholder="Enter your comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isAddingComment}
              />
              <div className="mt-2 d-flex align-items-center">
                <CButton 
                  color="success" 
                  size="sm" 
                  onClick={handleAddComment}
                  disabled={isAddingComment || !newComment.trim()}
                >
                  {isAddingComment ? <CSpinner size="sm" className="me-1"/> : null}
                  Submit Comment
                </CButton>
                {/* Add Comment Status Messages */} 
                {addCommentSuccess && <CAlert color="success" className="d-inline-block p-1 ms-2 mb-0">Comment added!</CAlert>}
                {addCommentError && <CAlert color="danger" className="d-inline-block p-1 ms-2 mb-0">Error: {addCommentError}</CAlert>}
              </div>
            </div>
          )}

          {/* Status Messages for State Update */}
          {isUpdatingState && <CSpinner size="sm" className="me-2"/>}
          {updateStateSuccess && <CAlert color="success" className="d-inline-block p-2">State updated successfully!</CAlert>}
          {updateStateError && <CAlert color="danger" className="d-inline-block p-2">Error: {updateStateError}</CAlert>}

          <h5 className="mt-4">Comments</h5>
          {commentLoading && (
            <div className="text-center">
              <CSpinner color="primary" />
              <p>Loading comments...</p>
            </div>
          )}
          {commentError && (
            <p className="text-danger">Error loading comments: {commentError}</p>
          )}
          {!commentLoading && !commentError && (
            <>
              {selectedTicketComments.length > 0 ? (
                selectedTicketComments.map((comment) => (
                  <CCard key={comment.id} className="mb-2">
                    <CCardBody className="p-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="fw-bold">{comment.author?.displayName || 'Unknown User'}</small>
                        <small className="text-muted">
                          {comment.created ? formatDistanceToNow(new Date(comment.created), { addSuffix: true }) : ''}
                        </small>
                      </div>
                       {/* Render comment body as HTML. Assumes Jira provides sanitized HTML. */}
                       {/* If body is Atlassian Document Format (ADF), a specific renderer would be needed. */}
                       <div dangerouslySetInnerHTML={{ __html: comment.body || '' }}></div>
                    </CCardBody>
                  </CCard>
                ))
              ) : (
                <p className="text-muted">No comments to display.</p>
              )}
            </>
          )}
        </COffcanvasBody>
      </COffcanvas>
    </>
  );
};

export default Dashboard; 