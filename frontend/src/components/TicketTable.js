import React from 'react';
import {
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CCollapse,
  CBadge,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowTop, cilArrowBottom, cilChevronBottom, cilChevronTop } from '@coreui/icons';
import { formatDistanceToNow } from 'date-fns';
import { getStateFromLabels, getStatusColor } from '../utils'; // Assuming utils are in ../

const TicketTable = ({
  title,
  tickets = [],
  isVisible,
  toggleVisibility,
  onRowClick,
  sortConfig,
  requestSort,
  jiraConfigUrl,
}) => {
  // Helper to render sort icon
  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? <CIcon icon={cilArrowTop} /> : <CIcon icon={cilArrowBottom} />;
  };

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
                <CTableHeaderCell scope="col" onClick={() => requestSort('renderedFields.customfield_15484')} style={{ cursor: 'pointer' }}>
                  Target SW Release <SortIcon columnKey="renderedFields.customfield_15484" />
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
              {tickets.map((ticket) => {
                const stateInfo = getStateFromLabels(ticket.fields?.labels);
                const statusName = ticket.fields?.status?.name || '';
                const statusColor = getStatusColor(statusName);

                return (
                  <CTableRow key={ticket.id} onClick={() => onRowClick(ticket)} style={{ cursor: 'pointer' }}>
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
                    <CTableDataCell>{ticket.renderedFields?.customfield_15484 || ticket.fields?.customfield_15484 || 'N/A'}</CTableDataCell>
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

export default TicketTable; 