import { useState } from 'react';

export const useTicketFilters = (initialFilter = 'ongoing', initialDateFilter = 'week') => {
  // State for date filtering
  const [selectedDateFilter, setSelectedDateFilter] = useState(initialDateFilter);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State for main button filtering
  const [activeButtonFilter, setActiveButtonFilter] = useState(initialFilter);

  // State for Assignee Filtering
  const [activeAssigneeFilter, setActiveAssigneeFilter] = useState(null);

  // Event Handlers for Date Filters
  const handleDateFilterClick = (filterType) => {
    setSelectedDateFilter(filterType);
    if (filterType !== 'range') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  // Event Handler for Main Filter Buttons
  const handleMainFilterClick = (filterType) => {
    setActiveButtonFilter(filterType);
  };

  // Event Handler for Assignee Filter Buttons
  const handleAssigneeFilterClick = (filterKey) => {
    setActiveAssigneeFilter(filterKey);
  };

  // Return state values and handlers
  return {
    selectedDateFilter,
    startDate,
    endDate,
    activeButtonFilter,
    activeAssigneeFilter,
    handleDateFilterClick,
    handleStartDateChange,
    handleEndDateChange,
    handleMainFilterClick,
    handleAssigneeFilterClick,
  };
}; 