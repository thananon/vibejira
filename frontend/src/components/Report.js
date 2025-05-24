import React, { useState, useRef } from 'react';
import { useTicketFilters } from '../hooks/useTicketFilters';
import { useJiraTickets } from '../hooks/useJiraTickets';
import { useSummaryData } from '../hooks/useSummaryData';

// Inline styles for email compatibility
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    color: '#333',
    margin: '20px',
    border: '1px solid #eee',
    padding: '20px',
  },
  heading: {
    color: '#2c3e50',
    borderBottom: '2px solid #3498db',
    paddingBottom: '10px',
    marginBottom: '20px',
  },
  subHeading: {
    color: '#3498db',
    marginTop: '30px',
    marginBottom: '15px',
    borderBottom: '1px solid #eee',
    paddingBottom: '5px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
    marginBottom: '20px',
    border: '1px solid #ddd',
  },
  th: {
    border: '1px solid #ddd',
    padding: '10px',
    textAlign: 'left',
    backgroundColor: '#f9f9f9',
    fontWeight: 'bold',
  },
  td: {
    border: '1px solid #ddd',
    padding: '10px',
    textAlign: 'left',
  },
  summaryKey: {
    fontWeight: 'bold',
    paddingRight: '10px',
    color: '#555',
  },
  noDataText: {
    fontStyle: 'italic',
    color: '#777',
    padding: '10px',
  },
  errorText: {
    color: 'red',
    fontWeight: 'bold',
  },
  loadingText: {
    fontStyle: 'italic',
  },
  filterInfo: {
    marginBottom: '20px',
    padding: '10px',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ccc',
  },
  copyButton: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '16px',
    margin: '10px 0 20px 0',
    cursor: 'pointer',
    borderRadius: '4px',
  },
  copyButtonSuccess: {
    backgroundColor: '#2ecc71', // Green for success
  },
  copyButtonError: {
    backgroundColor: '#e74c3c', // Red for error
  }
};

const Report = () => {
  const {
    selectedProject,
    selectedVersion,
    selectedSprint,
    selectedAssignee,
    loading: filtersLoading,
    error: filtersError,
  } = useTicketFilters();

  const {
    tickets,
    loading: ticketsLoading,
    error: ticketsError,
  } = useJiraTickets(selectedProject, selectedVersion, selectedSprint, selectedAssignee);

  const {
    summaryData,
    loading: summaryLoading,
    error: summaryError,
  } = useSummaryData(selectedProject, selectedVersion, selectedSprint, selectedAssignee);

  const [copyButtonText, setCopyButtonText] = useState('Copy Report to Clipboard');
  const [copyButtonState, setCopyButtonState] = useState(''); // '', 'success', 'error'
  const reportContentRef = useRef(null);

  const p1Tickets = tickets?.filter(ticket => ticket.fields.priority?.name === 'P1 - Highest') || [];
  const p2Tickets = tickets?.filter(ticket => ticket.fields.priority?.name === 'P2 - High') || [];
  const otherTickets = tickets?.filter(ticket => 
    ticket.fields.priority?.name !== 'P1 - Highest' && ticket.fields.priority?.name !== 'P2 - High'
  ) || [];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleCopyToClipboard = async () => {
    if (!reportContentRef.current) return;

    try {
      const htmlContent = reportContentRef.current.innerHTML;
      // Create a Blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      // Create a ClipboardItem with the Blob
      const clipboardItem = new ClipboardItem({ 'text/html': blob });
      // Write the ClipboardItem to the clipboard
      await navigator.clipboard.write([clipboardItem]);
      
      setCopyButtonText('Copied!');
      setCopyButtonState('success');
    } catch (err) {
      console.error('Failed to copy HTML to clipboard:', err);
      setCopyButtonText('Copy Failed!');
      setCopyButtonState('error');
    } finally {
      setTimeout(() => {
        setCopyButtonText('Copy Report to Clipboard');
        setCopyButtonState('');
      }, 3000);
    }
  };
  
  let buttonStyle = styles.copyButton;
  if (copyButtonState === 'success') {
    buttonStyle = {...buttonStyle, ...styles.copyButtonSuccess};
  } else if (copyButtonState === 'error') {
    buttonStyle = {...buttonStyle, ...styles.copyButtonError};
  }


  if (filtersLoading) return <p style={styles.loadingText}>Loading filter options...</p>;
  if (filtersError) return <p style={styles.errorText}>Error loading filter options: {filtersError.message}</p>;

  return (
    <div style={styles.container}>
      <button onClick={handleCopyToClipboard} style={buttonStyle}>
        {copyButtonText}
      </button>
      <div ref={reportContentRef} id="reportContentToCopy">
        <h1 style={styles.heading}>Weekly Report</h1>

        <div style={styles.filterInfo}>
          <p><strong>Project:</strong> {selectedProject || 'All'}</p>
          <p><strong>Version:</strong> {selectedVersion || 'All'}</p>
          <p><strong>Sprint:</strong> {selectedSprint || 'All'}</p>
          <p><strong>Assignee:</strong> {selectedAssignee || 'All'}</p>
        </div>

        {/* Summary Data Section */}
        <h2 style={styles.subHeading}>Summary</h2>
        {summaryLoading && <p style={styles.loadingText}>Loading summary data...</p>}
        {summaryError && <p style={styles.errorText}>Error loading summary data: {summaryError.message}</p>}
        {summaryData && !summaryLoading && !summaryError && (
          <table style={styles.table}>
            <tbody>
              {Object.entries(summaryData).map(([key, value]) => (
                <tr key={key}>
                  <td style={{...styles.td, ...styles.summaryKey}}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</td>
                  <td style={styles.td}>{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!summaryData && !summaryLoading && !summaryError && <p style={styles.noDataText}>No summary data available.</p>}

        {/* Ticket Sections */}
        {ticketsLoading && <p style={styles.loadingText}>Loading tickets...</p>}
        {ticketsError && <p style={styles.errorText}>Error loading tickets: {ticketsError.message}</p>}
        
        {!ticketsLoading && !ticketsError && (
          <>
            {/* P1 Tickets Section */}
            <h2 style={styles.subHeading}>P1 Tickets</h2>
            {p1Tickets.length > 0 ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Key</th>
                    <th style={styles.th}>Summary</th>
                    <th style={styles.th}>Priority</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Assignee</th>
                    <th style={styles.th}>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {p1Tickets.map(ticket => (
                    <tr key={ticket.id}>
                      <td style={styles.td}>{ticket.key}</td>
                      <td style={styles.td}>{ticket.fields.summary}</td>
                      <td style={styles.td}>{ticket.fields.priority?.name || 'N/A'}</td>
                      <td style={styles.td}>{ticket.fields.status?.name || 'N/A'}</td>
                      <td style={styles.td}>{ticket.fields.assignee?.displayName || 'Unassigned'}</td>
                      <td style={styles.td}>{formatDate(ticket.fields.updated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={styles.noDataText}>No P1 tickets for the current selection.</p>
            )}

            {/* P2 Tickets Section */}
            <h2 style={styles.subHeading}>P2 Tickets</h2>
            {p2Tickets.length > 0 ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Key</th>
                    <th style={styles.th}>Summary</th>
                    <th style={styles.th}>Priority</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Assignee</th>
                    <th style={styles.th}>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {p2Tickets.map(ticket => (
                    <tr key={ticket.id}>
                      <td style={styles.td}>{ticket.key}</td>
                      <td style={styles.td}>{ticket.fields.summary}</td>
                      <td style={styles.td}>{ticket.fields.priority?.name || 'N/A'}</td>
                      <td style={styles.td}>{ticket.fields.status?.name || 'N/A'}</td>
                      <td style={styles.td}>{ticket.fields.assignee?.displayName || 'Unassigned'}</td>
                      <td style={styles.td}>{formatDate(ticket.fields.updated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={styles.noDataText}>No P2 tickets for the current selection.</p>
            )}

            {/* Other Tickets Section */}
            <h2 style={styles.subHeading}>Other Tickets</h2>
            {otherTickets.length > 0 ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Key</th>
                    <th style={styles.th}>Summary</th>
                    <th style={styles.th}>Priority</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Assignee</th>
                    <th style={styles.th}>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {otherTickets.map(ticket => (
                    <tr key={ticket.id}>
                      <td style={styles.td}>{ticket.key}</td>
                      <td style={styles.td}>{ticket.fields.summary}</td>
                      <td style={styles.td}>{ticket.fields.priority?.name || 'N/A'}</td>
                      <td style
={styles.td}>{ticket.fields.status?.name || 'N/A'}</td>
                      <td style={styles.td}>{ticket.fields.assignee?.displayName || 'Unassigned'}</td>
                      <td style={styles.td}>{formatDate(ticket.fields.updated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={styles.noDataText}>No other tickets for the current selection.</p>
            )}
          </>
        )}
         {!tickets && !ticketsLoading && !ticketsError && <p style={styles.noDataText}>No tickets found for the current selection.</p>}
      </div>
    </div>
  );
};

export default Report;
