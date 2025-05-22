import React, { useState } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  COffcanvas,
  COffcanvasHeader,
  COffcanvasTitle,
  CCloseButton,
} from '@coreui/react';
import { useJiraConfig } from '../hooks/useJiraConfig';
import { useTicketFilters } from '../hooks/useTicketFilters';
import { useSummaryData } from '../hooks/useSummaryData';
import { useJiraTickets } from '../hooks/useJiraTickets';
import { useSidebar } from '../hooks/useSidebar';
import FilterBar from './FilterBar';
import SummaryCards from './SummaryCards';
import TicketTable from './TicketTable';
import TicketDetailPanel from './TicketDetailPanel';

const Dashboard = () => {
  const { jiraConfigUrl } = useJiraConfig();
  const ticketFilters = useTicketFilters();
  const { summaryData, summaryLoading, summaryError } = useSummaryData(ticketFilters);
  const {
    loading: ticketsLoading,
    error: ticketsError,
    sortConfig,
    requestSort,
    fetchTickets,
    p1Tickets,
    p2Tickets,
    otherTickets,
  } = useJiraTickets(ticketFilters);
  
  const sidebar = useSidebar(jiraConfigUrl, fetchTickets);

  const [p1Visible, setP1Visible] = useState(true);
  const [p2Visible, setP2Visible] = useState(true);
  const [otherVisible, setOtherVisible] = useState(true);

  return (
    <>
      <CCard style={{ width: '100%', minWidth: '1200px' }}>
        <CCardHeader>
          JIRA Ticket Dashboard
        </CCardHeader>
        <CCardBody>
          <FilterBar {...ticketFilters} />
          <SummaryCards 
            summaryData={summaryData} 
            summaryLoading={summaryLoading} 
            summaryError={summaryError} 
          />

          {ticketsLoading && <p>Loading tickets...</p>}
          {ticketsError && <p style={{ color: 'red' }}>Error fetching tickets: {ticketsError}</p>}
          {!ticketsLoading && !ticketsError && (
            <>
              <TicketTable
                title="P1 Tickets"
                tickets={p1Tickets}
                isVisible={p1Visible}
                toggleVisibility={() => setP1Visible(!p1Visible)}
                onRowClick={sidebar.handleRowClick}
                sortConfig={sortConfig}
                requestSort={requestSort}
                jiraConfigUrl={jiraConfigUrl}
              />
              <TicketTable
                title="P2 Tickets"
                tickets={p2Tickets}
                isVisible={p2Visible}
                toggleVisibility={() => setP2Visible(!p2Visible)}
                onRowClick={sidebar.handleRowClick}
                sortConfig={sortConfig}
                requestSort={requestSort}
                jiraConfigUrl={jiraConfigUrl}
              />
              <TicketTable
                title="Other Tickets"
                tickets={otherTickets}
                isVisible={otherVisible}
                toggleVisibility={() => setOtherVisible(!otherVisible)}
                onRowClick={sidebar.handleRowClick}
                sortConfig={sortConfig}
                requestSort={requestSort}
                jiraConfigUrl={jiraConfigUrl}
              />
            </>
          )}
        </CCardBody>
      </CCard>

      <COffcanvas placement="end" visible={sidebar.sidebarVisible} onHide={sidebar.closeSidebar} style={{ width: '600px' }}>
        <COffcanvasHeader>
          <COffcanvasTitle>Details for {sidebar.selectedTicketKey}</COffcanvasTitle>
          <CCloseButton className="text-reset" onClick={sidebar.closeSidebar} />
        </COffcanvasHeader>
        <TicketDetailPanel 
          {...sidebar}
          jiraConfigUrl={jiraConfigUrl}
        />
      </COffcanvas>
    </>
  );
};

export default Dashboard; 