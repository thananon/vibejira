import React from 'react';
import {
  CButtonGroup,
  CButton,
  CRow,
  CCol,
  CFormLabel,
} from '@coreui/react';

const FilterBar = ({ 
  activeButtonFilter, 
  handleMainFilterClick, 
  selectedDateFilter, 
  handleDateFilterClick,
  activeAssigneeFilter,
  handleAssigneeFilterClick,
  startDate,
  handleStartDateChange,
  endDate,
  handleEndDateChange,
}) => {
  return (
    <>
      {/* Main Filter Buttons */}
      <div className="mb-3">
        <CButtonGroup role="group" aria-label="Main Ticket Filter Buttons">
          <CButton color="primary" variant={activeButtonFilter === 'ongoing' ? undefined : 'outline'} onClick={() => handleMainFilterClick('ongoing')}>Ongoing Issues</CButton>
          <CButton color="warning" variant={activeButtonFilter === 'triagePending' ? undefined : 'outline'} onClick={() => handleMainFilterClick('triagePending')}>Triage Pending</CButton>
          <CButton color="info" variant={activeButtonFilter === 'waiting' ? undefined : 'outline'} onClick={() => handleMainFilterClick('waiting')}>Waiting</CButton>
          <CButton color="success" variant={activeButtonFilter === 'done' ? undefined : 'outline'} onClick={() => handleMainFilterClick('done')}>Done</CButton>
          <CButton color="danger" variant={activeButtonFilter === 'rejected' ? undefined : 'outline'} onClick={() => handleMainFilterClick('rejected')}>Rejected</CButton>
          <CButton color="danger" variant={activeButtonFilter === 'nri' ? undefined : 'outline'} onClick={() => handleMainFilterClick('nri')}>Not RCCL Issue</CButton>
        </CButtonGroup>
      </div>

      {/* Date Filter Buttons - Conditionally hide if Triage Pending or Waiting selected */}
      {activeButtonFilter !== 'triagePending' && activeButtonFilter !== 'waiting' && (
        <div className="mb-3">
          <span className="me-2">Filter by Updated Date:</span>
          <CButtonGroup role="group" aria-label="Date Filter Buttons">
            <CButton color="info" variant={selectedDateFilter === 'week' ? 'outline' : undefined} onClick={() => handleDateFilterClick('week')}>Last Week</CButton>
            <CButton color="info" variant={selectedDateFilter === 'month' ? 'outline' : undefined} onClick={() => handleDateFilterClick('month')}>Last Month</CButton>
            <CButton color="info" variant={selectedDateFilter === 'all' ? 'outline' : undefined} onClick={() => handleDateFilterClick('all')}>All Time</CButton>
            <CButton color="info" variant={selectedDateFilter === 'range' ? 'outline' : undefined} onClick={() => handleDateFilterClick('range')}>Range</CButton>
          </CButtonGroup>
        </div>
      )}

      {/* Assignee Filter Buttons - Conditionally hide if Triage Pending or Waiting selected */}
      {activeButtonFilter !== 'triagePending' && activeButtonFilter !== 'waiting' && (
        <div className="mb-3">
          <span className="me-2">Filter by Assignee:</span>
          <CButtonGroup role="group" aria-label="Assignee Filter Buttons">
            <CButton color="secondary" variant={activeAssigneeFilter === null ? undefined : 'outline'} onClick={() => handleAssigneeFilterClick(null)}>All Assignees</CButton>
            <CButton color="secondary" variant={activeAssigneeFilter === 'avinash' ? undefined : 'outline'} onClick={() => handleAssigneeFilterClick('avinash')}>Avinash</CButton>
            <CButton color="secondary" variant={activeAssigneeFilter === 'marzieh' ? undefined : 'outline'} onClick={() => handleAssigneeFilterClick('marzieh')}>Marzieh</CButton>
            <CButton color="secondary" variant={activeAssigneeFilter === 'me' ? undefined : 'outline'} onClick={() => handleAssigneeFilterClick('me')}>Me</CButton>
          </CButtonGroup>
        </div>
      )}

      {/* Conditional Date Range Inputs */}
      {activeButtonFilter !== 'triagePending' && activeButtonFilter !== 'waiting' && selectedDateFilter === 'range' && (
        <CRow className="mb-3 align-items-end">
          <CCol md={3}>
            <CFormLabel htmlFor="startDate">From Date:</CFormLabel>
            <input type="date" id="startDate" className="form-control" value={startDate} onChange={handleStartDateChange} />
          </CCol>
          <CCol md={3}>
            <CFormLabel htmlFor="endDate">To Date:</CFormLabel>
            <input type="date" id="endDate" className="form-control" value={endDate} onChange={handleEndDateChange} />
          </CCol>
        </CRow>
      )}
    </>
  );
};

export default FilterBar; 