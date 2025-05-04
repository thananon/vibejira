import React, { useState, useEffect } from 'react';
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
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilCommentBubble,
  cilTags,
  cilReload,
  cilChevronBottom,
  cilChevronTop,
  cilWarning,
  cilLoopCircular,
  cilFire,
  cilCheckCircle,
} from '@coreui/icons';
import { formatDistanceToNow } from 'date-fns';

// Base URL for the backend API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const Dashboard = () => {
  // State for fetched tickets, loading, and error
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for sidebar
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedTicketKey, setSelectedTicketKey] = useState(null);
  const [selectedTicketComments, setSelectedTicketComments] = useState([]);

  // State for collapsible sections
  const [p1Visible, setP1Visible] = useState(true);
  const [p2Visible, setP2Visible] = useState(true);
  const [otherVisible, setOtherVisible] = useState(true);

  // State for date filtering
  const [selectedDateFilter, setSelectedDateFilter] = useState('all'); // 'week', 'month', 'all', 'range'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // --- Fetch Data --- 
  useEffect(() => {
    // Define fetchTickets inside useEffect to capture current state
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        // Base JQL query (can be moved outside useEffect if static)
        const baseJql = `project = SWDEV AND issuetype = Defect AND "Triage Assignment" = "[1637333]" AND labels in (RCCL_TRIAGE_COMPLETED, RCCL_TRIAGE_PENDING, RCCL_TRIAGE_REJECTED, RCCL_TRIAGE_NEED_MORE_INFO)`;
        
        let dateFilterJql = '';
        if (selectedDateFilter === 'week') {
          dateFilterJql = ' AND updated >= -7d';
        } else if (selectedDateFilter === 'month') {
          dateFilterJql = ' AND updated >= -30d';
        } else if (selectedDateFilter === 'range' && startDate && endDate) {
          // Format dates as YYYY-MM-DD for JQL
          dateFilterJql = ` AND updated >= "${startDate}" AND updated <= "${endDate}"`;
        } else if (selectedDateFilter === 'range' && (!startDate || !endDate)) {
           // If range is selected but dates are incomplete, don't fetch yet
           console.log("Range selected, waiting for both dates.");
           setLoading(false); // Stop loading indicator
           // Optional: Clear tickets or show a message
           // setTickets([]); 
           return; // Exit fetchTickets early
        }

        // Combine JQL parts
        const finalJql = baseJql + dateFilterJql + ' ORDER BY updated DESC'; // Add ordering
        const encodedJql = encodeURIComponent(finalJql);
        // Increase maxResults for potentially larger date ranges
        const url = `${API_BASE_URL}/api/tickets?jql=${encodedJql}&maxResults=100`; 

        console.log(`Fetching tickets with JQL: ${finalJql}`); // Log the actual JQL
        console.log(`Fetching tickets from URL: ${url}`);

        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to fetch tickets'}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data); // Debug log

        if (data && Array.isArray(data.issues)) {
          setTickets(data.issues); 
        } else {
          console.error('Unexpected API response structure:', data);
          // Keep existing tickets or clear them?
          // setTickets([]); 
          throw new Error('Received unexpected data structure from API.');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setTickets([]); // Clear tickets on error
      } finally {
        setLoading(false);
      }
    };

    fetchTickets(); // Call the inner function

  }, [selectedDateFilter, startDate, endDate]); // Dependency array - run effect when these change


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

  // --- Event Handlers --- 
  // Function to handle row click - adapted for JIRA key
  const handleRowClick = (ticket) => {
    setSelectedTicketKey(ticket.key); 
    setSelectedTicketComments([]); // Clear mock comments - TODO: Fetch real comments later
    setSidebarVisible(true);
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

  // --- Render Functions --- 
  const renderTable = (data, title, isVisible, toggleVisibility) => {
    // TODO: Get JIRA_BASE_URL from config/context for full links
    const jiraBaseUrl = 'https://your-jira-instance.atlassian.net'; // Replace with actual or fetched base URL

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
                  <CTableHeaderCell scope="col">Key</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Summary</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Priority</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Status</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Created</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Updated</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {data.map((ticket) => (
                  <CTableRow key={ticket.id} onClick={() => handleRowClick(ticket)} style={{ cursor: 'pointer' }}>
                    <CTableDataCell>
                      <a 
                        href={`${jiraBaseUrl}/browse/${ticket.key}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ticket.key}
                      </a>
                    </CTableDataCell>
                    <CTableDataCell>{ticket.fields?.summary}</CTableDataCell>
                    <CTableDataCell>{ticket.fields?.priority?.name || ''}</CTableDataCell>
                    <CTableDataCell>{ticket.fields?.status?.name || ''}</CTableDataCell>
                    <CTableDataCell>
                      {ticket.fields?.created ? formatDistanceToNow(new Date(ticket.fields.created), { addSuffix: true }) : ''}
                    </CTableDataCell>
                    <CTableDataCell>
                      {ticket.fields?.updated ? formatDistanceToNow(new Date(ticket.fields.updated), { addSuffix: true }) : ''}
                    </CTableDataCell>
                  </CTableRow>
                ))}
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
          <div className="mb-3">
            <CButtonGroup role="group" aria-label="JIRA Query Buttons">
              <CButton color="primary">My Open Issues</CButton>
              <CButton color="secondary">Reported by Me</CButton>
              <CButton color="success">All Issues</CButton>
              <CButton color="warning">Done Issues</CButton>
            </CButtonGroup>
          </div>

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

          {selectedDateFilter === 'range' && (
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

          <CRow className="mb-4 text-center">
            <CCol sm={6} xl={3} className="mb-3 mb-xl-0">
              <CCard textColor="warning">
                <CCardBody>
                  <CIcon icon={cilWarning} size="xl" className="mb-2" />
                  <div>Triage Pending</div>
                  <div className="fs-2 fw-semibold">15</div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol sm={6} xl={3} className="mb-3 mb-xl-0">
              <CCard textColor="info">
                <CCardBody>
                  <CIcon icon={cilLoopCircular} size="xl" className="mb-2" />
                  <div>In Progress</div>
                  <div className="fs-2 fw-semibold">28</div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol sm={6} xl={3} className="mb-3 mb-sm-0">
              <CCard textColor="danger">
                <CCardBody>
                  <CIcon icon={cilFire} size="xl" className="mb-2" />
                  <div>Active P1</div>
                  <div className="fs-2 fw-semibold">3</div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol sm={6} xl={3}>
              <CCard textColor="success">
                <CCardBody>
                  <CIcon icon={cilCheckCircle} size="xl" className="mb-2" />
                  <div>Completed (Today)</div>
                  <div className="fs-2 fw-semibold">8</div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {loading && <p>Loading tickets...</p>}
          {error && <p style={{ color: 'red' }}>Error fetching tickets: {error}</p>}
          {!loading && !error && (
            <>
              {renderTable(p1Tickets, 'P1 Tickets', p1Visible, () => setP1Visible(!p1Visible))}
              {renderTable(p2Tickets, 'P2 Tickets', p2Visible, () => setP2Visible(!p2Visible))}
              {renderTable(otherTickets, 'Other Tickets', otherVisible, () => setOtherVisible(!otherVisible))}
            </>
          )}

        </CCardBody>
      </CCard>

      <COffcanvas placement="end" visible={sidebarVisible} onHide={() => setSidebarVisible(false)}>
        <COffcanvasHeader>
          <COffcanvasTitle>Details for {selectedTicketKey}</COffcanvasTitle>
          <CCloseButton className="text-reset" onClick={() => setSidebarVisible(false)} />
        </COffcanvasHeader>
        <COffcanvasBody>
          <div className="mb-3">
            <CButton color="primary" className="me-2" disabled>
              <CIcon icon={cilCommentBubble} className="me-1"/> Add Comment
            </CButton>
            <CButton color="secondary" className="me-2" disabled>
              <CIcon icon={cilTags} className="me-1" /> Add Label
            </CButton>
            <CButton color="light" disabled>
              <CIcon icon={cilReload} className="me-1" /> Refresh
            </CButton>
          </div>

          <h5>Comments</h5>
          {selectedTicketComments.length > 0 ? (
            selectedTicketComments.map((comment) => (
              <div key={comment.id} className="mb-2 p-2 border rounded bg-light text-dark">
                <strong>{comment.author}:</strong> {comment.body}
              </div>
            ))
          ) : (
            <p>No comments yet.</p>
          )}
        </COffcanvasBody>
      </COffcanvas>
    </>
  );
};

export default Dashboard; 