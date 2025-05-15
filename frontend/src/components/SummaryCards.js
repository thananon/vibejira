import React from 'react';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilWarning,
  cilLoopCircular,
  cilFire,
  cilCheckCircle,
  cilXCircle,
  cilInfo,
} from '@coreui/icons';
import './SummaryCards.css'; // Import custom CSS

const SummaryCards = ({ summaryData, summaryLoading, summaryError }) => {
  if (summaryLoading) return <p>Loading summary...</p>;
  if (summaryError) return <p className="text-danger">Error loading summary: {summaryError}</p>;

  return (
    <CRow className="mb-4 text-center">
      <CCol sm={6} lg={2} className="mb-3 mb-lg-0">
        <CCard textColor="warning" className="summary-card warning-card">
          <CCardBody>
            <div className="icon-container">
              <CIcon icon={cilWarning} size="xl" className="summary-icon" />
            </div>
            <div className="card-title">Triage Pending</div>
            <div className="card-value">{summaryData.triagePending}</div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol sm={6} lg={2} className="mb-3 mb-lg-0">
        <CCard textColor="info" className="summary-card info-card">
          <CCardBody>
            <div className="icon-container">
              <CIcon icon={cilLoopCircular} size="xl" className="summary-icon rotate" />
            </div>
            <div className="card-title">In Progress</div>
            <div className="card-value">{summaryData.inProgress}</div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol sm={6} lg={2} className="mb-3 mb-lg-0">
        <CCard textColor="danger" className="summary-card danger-card">
          <CCardBody>
            <div className="icon-container">
              <CIcon icon={cilFire} size="xl" className="summary-icon pulse" />
            </div>
            <div className="card-title">Active P1</div>
            <div className="card-value">{summaryData.activeP1}</div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol sm={6} lg={2} className="mb-3 mb-lg-0">
        <CCard textColor="info" className="summary-card info-card-alt">
          <CCardBody>
            <div className="icon-container">
              <CIcon icon={cilInfo} size="xl" className="summary-icon bounce" />
            </div>
            <div className="card-title">Waiting for Info</div>
            <div className="card-value">{summaryData.waitingForInfo}</div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol sm={6} lg={2} className="mb-3 mb-lg-0">
        <CCard textColor="success" className="summary-card success-card">
          <CCardBody>
            <div className="icon-container">
              <CIcon icon={cilCheckCircle} size="xl" className="summary-icon scale" />
            </div>
            <div className="card-title">Completed</div>
            <div className="card-value">{summaryData.completedToday}</div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol sm={6} lg={2} className="mb-3 mb-lg-0">
        <CCard textColor="danger" className="summary-card danger-card-alt">
          <CCardBody>
            <div className="icon-container">
              <CIcon icon={cilXCircle} size="xl" className="summary-icon shake" />
            </div>
            <div className="card-title">Rejected</div>
            <div className="card-value">{summaryData.rejected}</div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default SummaryCards;