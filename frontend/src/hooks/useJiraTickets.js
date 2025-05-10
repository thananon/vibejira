import { useState, useEffect, useCallback, useMemo } from 'react';
import { getStateFromLabels, getPriorityCategory } from '../utils';
// Import mock data and filter helpers
import { mockTickets, filterTicketsByDate, filterTicketsByAssignee, filterTicketsByButton } from '../mockData';

// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001'; // Not needed for mock

export const useJiraTickets = (filters) => {
  const { selectedDateFilter, startDate, endDate, activeButtonFilter, activeAssigneeFilter } = filters;

  const [allMockTickets] = useState(mockTickets); // Store the original mock data
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(false); // Set to false, data is available immediately
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'fields.updated', direction: 'descending' });

  const applyFilters = useCallback(() => {
    setLoading(true);
    let currentTickets = [...allMockTickets];

    // Apply button filter (status/label based)
    currentTickets = filterTicketsByButton(currentTickets, activeButtonFilter);
    
    // Apply date filter
    currentTickets = filterTicketsByDate(currentTickets, selectedDateFilter, startDate, endDate);

    // Apply assignee filter
    currentTickets = filterTicketsByAssignee(currentTickets, activeAssigneeFilter);
    
    setFilteredTickets(currentTickets);
    setLoading(false);
  }, [allMockTickets, activeButtonFilter, selectedDateFilter, startDate, endDate, activeAssigneeFilter]);

  // This function is called by Dashboard to refresh tickets. Now it just re-applies filters.
  const fetchTickets = useCallback(() => {
    // console.log('Mock fetchTickets called, re-applying filters.');
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    // console.log('Filters changed, applying...', filters);
    applyFilters();
  }, [applyFilters]); // applyFilters has all filter dependencies

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortData = useCallback((items, config) => {
    const sortedItems = [...items];
    if (config.key !== null) {
      sortedItems.sort((a, b) => {
        const getNestedValue = (obj, keyPath) => keyPath.split('.').reduce((o, k) => (o || {})[k], obj);
        let aValue, bValue;
        if (config.key === 'state') {
          aValue = getStateFromLabels(getNestedValue(a, 'fields.labels')).text;
          bValue = getStateFromLabels(getNestedValue(b, 'fields.labels')).text;
        } else if (config.key === 'fields.created' || config.key === 'fields.updated') {
          aValue = getNestedValue(a, config.key);
          bValue = getNestedValue(b, config.key);
          aValue = aValue ? new Date(aValue).getTime() : null;
          bValue = bValue ? new Date(bValue).getTime() : null;
        } else {
          aValue = getNestedValue(a, config.key);
          bValue = getNestedValue(b, config.key);
        }
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        const compareResult = typeof aValue === 'string' && typeof bValue === 'string'
          ? aValue.localeCompare(bValue, undefined, { sensitivity: 'base' })
          : (aValue < bValue ? -1 : (aValue > bValue ? 1 : 0));
        return config.direction === 'ascending' ? compareResult : -compareResult;
      });
    }
    return sortedItems;
  }, []);

  const p1Tickets = useMemo(() => sortData(filteredTickets.filter(ticket => getPriorityCategory(ticket) === 'P1'), sortConfig), [filteredTickets, sortConfig, sortData]);
  const p2Tickets = useMemo(() => sortData(filteredTickets.filter(ticket => getPriorityCategory(ticket) === 'P2'), sortConfig), [filteredTickets, sortConfig, sortData]);
  const otherTickets = useMemo(() => sortData(filteredTickets.filter(ticket => getPriorityCategory(ticket) === 'Other'), sortConfig), [filteredTickets, sortConfig, sortData]);

  return {
    tickets: filteredTickets, // Provide filtered tickets
    loading,
    error,
    sortConfig,
    requestSort,
    fetchTickets, 
    p1Tickets,
    p2Tickets,
    otherTickets,
  };
}; 