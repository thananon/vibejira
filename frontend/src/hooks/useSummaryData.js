import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export const useSummaryData = (filters) => {
  const { activeButtonFilter, selectedDateFilter, startDate, endDate, activeAssigneeFilter } = filters;

  const [summaryData, setSummaryData] = useState({ triagePending: '-', inProgress: '-', activeP1: '-', waitingForInfo: '-', completedToday: '-', rejected: '-' });
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        // Build query params from filter state passed via args
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
      setSummaryLoading(false); // Prevent infinite loading state
    } else {
      fetchSummary();
    }

  }, [activeButtonFilter, selectedDateFilter, startDate, endDate, activeAssigneeFilter]); // Re-run effect when filters change

  return { summaryData, summaryLoading, summaryError };
}; 