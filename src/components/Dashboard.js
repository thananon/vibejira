import React, { useState } from 'react';
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

const Dashboard = () => {
  // State for sidebar
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedTicketKey, setSelectedTicketKey] = useState(null);
  const [selectedTicketComments, setSelectedTicketComments] = useState([]);

  // State for collapsible sections
  const [p1Visible, setP1Visible] = useState(true);
  const [p2Visible, setP2Visible] = useState(true);
  const [otherVisible, setOtherVisible] = useState(true);

  // Mock data for the JIRA tickets table - Added priority
  const mockTickets = [
    {
      id: 1,
      name: 'VIBE-101',
      title: 'Implement Dashboard UI',
      date: '2024-07-26',
      category: 'Frontend',
      priority: 'P1',
      lastUpdated: '2024-07-26 10:00',
    },
    {
      id: 2,
      name: 'VIBE-102',
      title: 'Setup Backend API',
      date: '2024-07-25',
      category: 'Backend',
      priority: 'P1',
      lastUpdated: '2024-07-26 09:30',
    },
    {
      id: 3,
      name: 'VIBE-103',
      title: 'Define Database Schema',
      date: '2024-07-24',
      category: 'Database',
      priority: 'P2',
      lastUpdated: '2024-07-25 15:00',
    },
    {
      id: 4,
      name: 'VIBE-104',
      title: 'Add Authentication',
      date: '2024-07-27',
      category: 'Backend',
      priority: 'P2',
      lastUpdated: '2024-07-27 11:00',
    },
    {
      id: 5,
      name: 'VIBE-105',
      title: 'Deploy Frontend Mockup',
      date: '2024-07-28',
      category: 'Infra',
      priority: 'P3',
      lastUpdated: '2024-07-28 09:00',
    },
    {
      id: 6,
      name: 'VIBE-106',
      title: 'Write Feature Docs',
      date: '2024-07-28',
      category: 'Docs',
      priority: 'P4',
      lastUpdated: '2024-07-28 11:00',
    },
  ];

  // Filter tickets by priority
  const p1Tickets = mockTickets.filter(ticket => ticket.priority === 'P1');
  const p2Tickets = mockTickets.filter(ticket => ticket.priority === 'P2');
  const otherTickets = mockTickets.filter(ticket => ticket.priority !== 'P1' && ticket.priority !== 'P2');

  // Mock comments data
  const mockComments = {
    'VIBE-101': [
      { id: 'c1', author: 'Alice', body: 'Looks good, proceeding with implementation.' },
      { id: 'c2', author: 'Bob', body: 'Need to adjust the padding slightly.' },
    ],
    'VIBE-102': [
      { id: 'c3', author: 'Charlie', body: 'Initial setup complete.' },
    ],
    'VIBE-103': [
      { id: 'c4', author: 'Alice', body: 'Schema defined and reviewed.' },
      { id: 'c5', author: 'David', body: 'Added indexes for performance.' },
      { id: 'c6', author: 'Alice', body: 'Looks perfect, thanks!.' },
    ],
    'VIBE-104': [], // No comments yet
  };

  // Function to handle row click
  const handleRowClick = (ticket) => {
    setSelectedTicketKey(ticket.name); // Use ticket.name as the key for mock data
    setSelectedTicketComments(mockComments[ticket.name] || []);
    setSidebarVisible(true);
  };

  // Updated Function to render a collapsible table
  const renderTable = (tickets, title, isVisible, toggleVisibility) => {
    if (tickets.length === 0) {
      // Still render the header even if empty, so it can be collapsed/expanded
      // Potentially show a message inside the collapse when empty?
    }
    return (
      <div className="mb-4">
        <h4 onClick={toggleVisibility} style={{ cursor: 'pointer' }} className="d-flex justify-content-between align-items-center">
          {title} ({tickets.length})
          <CIcon icon={isVisible ? cilChevronBottom : cilChevronTop} />
        </h4>
        <CCollapse visible={isVisible}>
          {tickets.length > 0 ? (
            <CTable hover responsive bordered small className="mt-2">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell scope="col">#</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Ticket Name</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Title</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Priority</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Date Created</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Category</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Last Updated</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {tickets.map((ticket, index) => (
                  <CTableRow key={ticket.id} onClick={() => handleRowClick(ticket)} style={{ cursor: 'pointer' }}>
                    <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                    <CTableDataCell>{ticket.name}</CTableDataCell>
                    <CTableDataCell>{ticket.title}</CTableDataCell>
                    <CTableDataCell>{ticket.priority}</CTableDataCell>
                    <CTableDataCell>{ticket.date}</CTableDataCell>
                    <CTableDataCell>{ticket.category}</CTableDataCell>
                    <CTableDataCell>{ticket.lastUpdated}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          ) : (
            <p className="text-muted mt-2">No tickets in this section.</p> // Message if empty
          )}
        </CCollapse>
      </div>
    );
  };

  return (
    <>
      <CCard>
        <CCardHeader>
          JIRA Ticket Dashboard
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

          {/* Summary Cards Row */}
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

          {/* Render collapsible tables based on priority */}
          {renderTable(p1Tickets, 'P1 Tickets', p1Visible, () => setP1Visible(!p1Visible))}
          {renderTable(p2Tickets, 'P2 Tickets', p2Visible, () => setP2Visible(!p2Visible))}
          {renderTable(otherTickets, 'Other Tickets', otherVisible, () => setOtherVisible(!otherVisible))}

        </CCardBody>
      </CCard>

      <COffcanvas placement="end" visible={sidebarVisible} onHide={() => setSidebarVisible(false)}>
        <COffcanvasHeader>
          <COffcanvasTitle>Comments for {selectedTicketKey}</COffcanvasTitle>
          <CCloseButton className="text-reset" onClick={() => setSidebarVisible(false)} />
        </COffcanvasHeader>
        <COffcanvasBody>
          <div className="mb-4">
            <CButtonGroup role="group" aria-label="Ticket Actions">
              <CButton color="primary">
                <CIcon icon={cilCommentBubble} className="me-2" />
                Add Comment
              </CButton>
              <CButton color="secondary">
                <CIcon icon={cilTags} className="me-2" />
                Add Label
              </CButton>
              <CButton color="info">
                <CIcon icon={cilReload} className="me-2" />
                Refresh
              </CButton>
            </CButtonGroup>
          </div>

          {selectedTicketComments.length > 0 ? (
            selectedTicketComments.map(comment => (
              <div key={comment.id} className="mb-3 p-2 border rounded bg-body-secondary">
                <strong>{comment.author}:</strong>
                <p className="mb-0 mt-1">{comment.body}</p>
              </div>
            ))
          ) : (
            <p>No comments found for this ticket.</p>
          )}
        </COffcanvasBody>
      </COffcanvas>
    </>
  );
};

export default Dashboard; 