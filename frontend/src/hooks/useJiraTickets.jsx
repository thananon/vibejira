import { useState, useEffect, useCallback, useMemo } from 'react';
import { getStateFromLabels, getPriorityCategory } from '../utils'; // Assuming utils.js is in ../

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const useJiraTickets = (filters) => {
  const { selectedDateFilter, startDate, endDate, activeButtonFilter, activeAssigneeFilter } = filters;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'fields.updated', direction: 'descending' });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const defectType = `issuetype = Defect`;
      let finalJql = '';

      if (activeButtonFilter === 'triagePending') {
        finalJql = `${defectType} AND labels = RCCL_TRIAGE_PENDING ORDER BY updated DESC`;
      } else if (activeButtonFilter === 'waiting') {
        finalJql = `${defectType} AND labels = RCCL_TRIAGE_NEED_MORE_INFO ORDER BY updated DESC`;
      } else if (activeButtonFilter === 'nri') {
        let dateFilterJql = '';
        if (selectedDateFilter === 'week') dateFilterJql = ' AND updated >= -7d';
        else if (selectedDateFilter === 'month') dateFilterJql = ' AND updated >= -30d';
        else if (selectedDateFilter === 'range' && startDate && endDate) dateFilterJql = ` AND updated >= "${startDate}" AND updated <= "${endDate}"`;
        else if (selectedDateFilter === 'range' && (!startDate || !endDate)) {
          console.log("Range selected for NRI ticket list, waiting for both dates.");
          setLoading(false); return;
        }
        let assigneeFilterJql = '';
        if (activeAssigneeFilter === 'avinash') assigneeFilterJql = ' AND assignee = "Potnuru, Avinash"';
        else if (activeAssigneeFilter === 'marzieh') assigneeFilterJql = ' AND assignee = "Berenjkoub, Marzieh"';
        else if (activeAssigneeFilter === 'me') assigneeFilterJql = ' AND assignee = "Patinyasakdikul, Arm"';
        finalJql = `${defectType} AND labels = RCCL_TRIAGE_NRI${assigneeFilterJql}${dateFilterJql} ORDER BY updated DESC`;
      } else if (activeButtonFilter === 'rejected') {
        const specificRejectedLabel = `labels = RCCL_TRIAGE_REJECTED`;
        const generalRcclTriageLabels = `labels in (RCCL_TRIAGE_COMPLETED, RCCL_TRIAGE_PENDING, RCCL_TRIAGE_NEED_MORE_INFO, RCCL_TRIAGE_REJECTED)`;
        const rejectedStatus = `status = Rejected`;

        let dateFilterJql = '';
        if (selectedDateFilter === 'week') dateFilterJql = ' AND updated >= -7d';
        else if (selectedDateFilter === 'month') dateFilterJql = ' AND updated >= -30d';
        else if (selectedDateFilter === 'range' && startDate && endDate) dateFilterJql = ` AND updated >= "${startDate}" AND updated <= "${endDate}"`;
        else if (selectedDateFilter === 'range' && (!startDate || !endDate)) {
          console.log("Range selected for rejected ticket list, waiting for both dates.");
          setLoading(false); return;
        }
        let assigneeFilterJql = '';
        if (activeAssigneeFilter === 'avinash') assigneeFilterJql = ' AND assignee = "Potnuru, Avinash"';
        else if (activeAssigneeFilter === 'marzieh') assigneeFilterJql = ' AND assignee = "Berenjkoub, Marzieh"';
        else if (activeAssigneeFilter === 'me') assigneeFilterJql = ' AND assignee = "Patinyasakdikul, Arm"';
        
        finalJql = `${defectType} AND ((${specificRejectedLabel}) OR (${generalRcclTriageLabels} AND ${rejectedStatus}))${assigneeFilterJql}${dateFilterJql} ORDER BY updated DESC`;
      } else {
        let currentLabels = `labels in (RCCL_TRIAGE_COMPLETED, RCCL_TRIAGE_PENDING, RCCL_TRIAGE_NEED_MORE_INFO, RCCL_TRIAGE_REJECTED, RCCL_TRIAGE_NRI)`;
        let statusFilterJql = '';
        if (activeButtonFilter === 'ongoing') {
          statusFilterJql = ' AND status in (Opened, Assessed, Analyzed)';
          currentLabels = `labels in (RCCL_TRIAGE_COMPLETED, RCCL_TRIAGE_PENDING, RCCL_TRIAGE_NEED_MORE_INFO, RCCL_TRIAGE_REJECTED)`;
        } else if (activeButtonFilter === 'done') {
          statusFilterJql = ' AND status in (Implemented, Closed)';
        }
        let dateFilterJql = '';
        if (selectedDateFilter === 'week') dateFilterJql = ' AND updated >= -7d';
        else if (selectedDateFilter === 'month') dateFilterJql = ' AND updated >= -30d';
        else if (selectedDateFilter === 'range' && startDate && endDate) dateFilterJql = ` AND updated >= "${startDate}" AND updated <= "${endDate}"`;
        else if (selectedDateFilter === 'range' && (!startDate || !endDate)) {
          console.log("Range selected for ticket list, waiting for both dates.");
          setLoading(false); return;
        }
        let assigneeFilterJql = '';
        if (activeAssigneeFilter === 'avinash') assigneeFilterJql = ' AND assignee = "Potnuru, Avinash"';
        else if (activeAssigneeFilter === 'marzieh') assigneeFilterJql = ' AND assignee = "Berenjkoub, Marzieh"';
        else if (activeAssigneeFilter === 'me') assigneeFilterJql = ' AND assignee = "Patinyasakdikul, Arm"';
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
  }, [selectedDateFilter, startDate, endDate, activeButtonFilter, activeAssigneeFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

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
  }, []); // Removed getStateFromLabels from dependency array (imported functions are stable)

  const p1Tickets = useMemo(() => sortData(tickets.filter(ticket => getPriorityCategory(ticket) === 'P1'), sortConfig), [tickets, sortConfig, sortData]); // Removed getPriorityCategory
  const p2Tickets = useMemo(() => sortData(tickets.filter(ticket => getPriorityCategory(ticket) === 'P2'), sortConfig), [tickets, sortConfig, sortData]); // Removed getPriorityCategory
  const otherTickets = useMemo(() => sortData(tickets.filter(ticket => getPriorityCategory(ticket) === 'Other'), sortConfig), [tickets, sortConfig, sortData]); // Removed getPriorityCategory

  return {
    tickets,
    loading,
    error,
    sortConfig,
    requestSort,
    fetchTickets, // Expose fetchTickets for manual refresh if needed by other hooks/components
    p1Tickets,
    p2Tickets,
    otherTickets,
  };
}; 