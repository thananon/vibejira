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

const SummaryCards = ({ summaryData, summaryLoading, summaryError }) => {
  if (summaryLoading) return <p>Loading summary...</p>;
  if (summaryError) return <p className="text-danger">Error loading summary: {summaryError}</p>;

  return (
    <CRow className="mb-4 text-center">
      <CCol sm={6} lg={2} className="mb-3 mb-lg-0">
        <CCard textColor="warning">
          <CCardBody>
            <CIcon icon={cilWarning} size="xl" className="mb-2" />
            <div>Triage Pending</div>
            <div className="fs-2 fw-semibold">{summaryData.triagePending}</div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol sm={6} lg={2} className="mb-3 mb-lg-0">
        <CCard textColor="info">
          <CCardBody>
            <CIcon icon={cilLoopCircular} size="xl" className="mb-2" />
            <div>In Progress</div>
            <div className="fs-2 fw-semibold">{summaryData.inProgress}</div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol sm={6} lg={2} className="mb-3 mb-lg-0">
        <CCard textColor="danger">
          <CCardBody>
            <CIcon icon={cilFire} size="xl" className="mb-2" />
            <div>Active P1</div>
            <div className="fs-2 fw-semibold">{summaryData.activeP1}</div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol sm={6} lg={2} className="mb-3 mb-lg-0">
        <CCard textColor="info">
          <CCardBody>
            <CIcon icon={cilInfo} size="xl" className="mb-2" />
            <div>Waiting for Info</div>
            <div className="fs-2 fw-semibold">{summaryData.waitingForInfo}</div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol sm={6} lg={2} className="mb-3 mb-lg-0">
        <CCard textColor="success">
          <CCardBody>
            <CIcon icon={cilCheckCircle} size="xl" className="mb-2" />
            <div>Completed</div>
            <div className="fs-2 fw-semibold">{summaryData.completedToday}</div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol sm={6} lg={2} className="mb-3 mb-lg-0">
        <CCard textColor="danger">
          <CCardBody>
            <CIcon icon={cilXCircle} size="xl" className="mb-2" />
            <div>Rejected</div>
            <div className="fs-2 fw-semibold">{summaryData.rejected}</div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default SummaryCards; 