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

  // --- Fetch Data --- 
  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const jql = 'project = SWDEV ORDER BY created DESC';
        const encodedJql = encodeURIComponent(jql);
        const url = `${API_BASE_URL}/api/tickets?jql=${encodedJql}&maxResults=10`;

        console.log(`Fetching tickets from: ${url}`); // Debug log

        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to fetch tickets'}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data); // Debug log

        // Check if the response has the expected 'issues' array
        if (data && Array.isArray(data.issues)) {
          setTickets(data.issues); 
        } else {
          console.error('Unexpected API response structure:', data);
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

    fetchTickets();
  }, []); // Empty dependency array ensures this runs only once on mount


  // --- Data Filtering --- 
  // Filter tickets by priority based on JIRA API structure
  const getPriorityName = (ticket) => ticket?.fields?.priority?.name || 'Unknown';

  const p1Tickets = tickets.filter(ticket => getPriorityName(ticket).toUpperCase() === 'P1');
  const p2Tickets = tickets.filter(ticket => getPriorityName(ticket).toUpperCase() === 'P2');
  const otherTickets = tickets.filter(ticket => 
    !['P1', 'P2'].includes(getPriorityName(ticket).toUpperCase())
  );

  // --- Event Handlers --- 
  // Function to handle row click - adapted for JIRA key
  const handleRowClick = (ticket) => {
    setSelectedTicketKey(ticket.key); 
    setSelectedTicketComments([]); // Clear mock comments - TODO: Fetch real comments later
    setSidebarVisible(true);
  };

  // --- Render Functions --- 
  // Updated Function to render a collapsible table - uses JIRA API fields
  const renderTable = (data, title, isVisible, toggleVisibility) => {
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
                  <CTableHeaderCell scope="col">#</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Key</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Summary</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Priority</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Type</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Created</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Updated</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {data.map((ticket, index) => (
                  <CTableRow key={ticket.id} onClick={() => handleRowClick(ticket)} style={{ cursor: 'pointer' }}>
                    <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                    <CTableDataCell>{ticket.key}</CTableDataCell>
                    <CTableDataCell>{ticket.fields?.summary}</CTableDataCell>
                    <CTableDataCell>{ticket.fields?.priority?.name}</CTableDataCell>
                    <CTableDataCell>{ticket.fields?.issuetype?.name}</CTableDataCell> 
                    <CTableDataCell>{new Date(ticket.fields?.created).toLocaleString()}</CTableDataCell>
                    <CTableDataCell>{new Date(ticket.fields?.updated).toLocaleString()}</CTableDataCell>
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
            {/* TODO: Make buttons functional later */}
            <CButtonGroup role="group" aria-label="JIRA Query Buttons">
              <CButton color="primary">My Open Issues</CButton>
              <CButton color="secondary">Reported by Me</CButton>
              <CButton color="success">All Issues</CButton>
              <CButton color="warning">Done Issues</CButton>
            </CButtonGroup>
          </div>

          {/* Summary Cards Row - TODO: Fetch summary data */}
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

          {/* Ticket Tables Section */}
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

      {/* Sidebar Canvas */}
      <COffcanvas placement="end" visible={sidebarVisible} onHide={() => setSidebarVisible(false)}>
        <COffcanvasHeader>
          <COffcanvasTitle>Details for {selectedTicketKey}</COffcanvasTitle> // Changed title slightly
          <CCloseButton className="text-reset" onClick={() => setSidebarVisible(false)} />
        </COffcanvasHeader>
        <COffcanvasBody>
          {/* Action Buttons */}
          <div className="mb-3">
            <CButton color="primary" className="me-2" disabled> {/* TODO: Implement */} 
              <CIcon icon={cilCommentBubble} className="me-1"/> Add Comment
            </CButton>
            <CButton color="secondary" className="me-2" disabled> {/* TODO: Implement */}
              <CIcon icon={cilTags} className="me-1" /> Add Label
            </CButton>
            <CButton color="light" disabled> {/* TODO: Implement */}
              <CIcon icon={cilReload} className="me-1" /> Refresh
            </CButton>
          </div>

          {/* Comments Section - TODO: Fetch and display real comments */}
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