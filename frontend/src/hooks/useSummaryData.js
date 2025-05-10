import { useState, useEffect, useCallback } from 'react';
import { mockTickets, filterTicketsByDate, filterTicketsByAssignee, filterTicketsByButton } from '../mockData'; // Import mock data and filters

// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001'; // Not needed

export const useSummaryData = (filters) => {
  const { activeButtonFilter, selectedDateFilter, startDate, endDate, activeAssigneeFilter } = filters;

  const [summaryData, setSummaryData] = useState({ triagePending: 0, inProgress: 0, activeP1: 0, waitingForInfo: 0, completedToday: 0, rejected: 0 });
  const [summaryLoading, setSummaryLoading] = useState(false); // No async loading for mock
  const [summaryError, setSummaryError] = useState(null);

  const calculateSummary = useCallback(() => {
    setSummaryLoading(true);
    // First, apply the main filters to the tickets similar to useJiraTickets
    let currentTickets = [...mockTickets];
    currentTickets = filterTicketsByButton(currentTickets, activeButtonFilter);
    currentTickets = filterTicketsByDate(currentTickets, selectedDateFilter, startDate, endDate);
    currentTickets = filterTicketsByAssignee(currentTickets, activeAssigneeFilter);

    // Then, calculate summaries based on this filtered set or specific subsets
    const triagePendingCount = mockTickets.filter(ticket => (ticket.fields.labels || []).includes('RCCL_TRIAGE_PENDING')).length;
    const inProgressCount = mockTickets.filter(ticket => 
        (['Open', 'Assessed', 'Analyzed'].includes(ticket.fields.status.name)) && 
        (ticket.fields.labels || []).some(l => ['RCCL_TRIAGE_COMPLETED', 'RCCL_TRIAGE_PENDING', 'RCCL_TRIAGE_NEED_MORE_INFO', 'RCCL_TRIAGE_REJECTED'].includes(l))
    ).length;
    const activeP1Count = mockTickets.filter(ticket => ticket.fields.priority.name === 'P1' && !['Implemented', 'Closed', 'Rejected'].includes(ticket.fields.status.name)).length;
    const waitingForInfoCount = mockTickets.filter(ticket => (ticket.fields.labels || []).includes('RCCL_TRIAGE_NEED_MORE_INFO')).length;
    
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const completedTodayCount = mockTickets.filter(ticket => 
        ['Implemented', 'Closed'].includes(ticket.fields.status.name) && 
        new Date(ticket.fields.updated) >= startOfToday
    ).length;

    const rejectedCount = mockTickets.filter(ticket => 
        (ticket.fields.labels || []).includes('RCCL_TRIAGE_REJECTED') || 
        (ticket.fields.status.name === 'Rejected' && (ticket.fields.labels || []).some(l => l.startsWith('RCCL_TRIAGE_')))
    ).length;
    
    setSummaryData({
        triagePending: triagePendingCount,
        inProgress: inProgressCount,
        activeP1: activeP1Count,
        waitingForInfo: waitingForInfoCount,
        completedToday: completedTodayCount, 
        rejected: rejectedCount,
    });
    setSummaryLoading(false);
  }, [activeButtonFilter, selectedDateFilter, startDate, endDate, activeAssigneeFilter]); // Dependencies are the filters

  useEffect(() => {
    // console.log('Filters changed for summary, calculating...', filters);
    if (selectedDateFilter === 'range' && (!startDate || !endDate)) {
      // console.log("Range selected for summary, waiting for both dates. Setting defaults.");
      setSummaryData({ triagePending: 0, inProgress: 0, activeP1: 0, waitingForInfo: 0, completedToday: 0, rejected: 0 });
      setSummaryLoading(false);
    } else {
      calculateSummary();
    }
  }, [calculateSummary, selectedDateFilter, startDate, endDate]); // calculateSummary has its own deps

  return { summaryData, summaryLoading, summaryError };
}; 