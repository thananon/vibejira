import React from 'react';
import {
  COffcanvasBody,
  CButton,
  CCard,
  CCardBody,
  CSpinner,
  CAlert,
  CFormTextarea,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilCommentBubble,
  cilReload,
  cilWarning,
  cilCheckCircle,
  cilInfo,
  cilBan,
} from '@coreui/icons';
import { formatDistanceToNow } from 'date-fns';

const TicketDetailPanel = ({
  selectedTicketData,
  selectedTicketComments,
  commentLoading,
  commentError,
  isUpdatingState,
  updateStateError,
  updateStateSuccess,
  showCommentInput,
  setShowCommentInput,
  newComment,
  setNewComment,
  isAddingComment,
  addCommentError,
  addCommentSuccess,
  handleUpdateTicketState,
  handleAddComment,
  jiraConfigUrl,
  selectedTicketKey,
  // fetchComments // Not passed for now, assuming parent (useSidebar) handles re-fetching needed comments
}) => {

  return (
    <COffcanvasBody>
      {selectedTicketData?.fields?.created && (
        <p className="text-muted mb-2">
          Created: {formatDistanceToNow(new Date(selectedTicketData.fields.created), { addSuffix: true })}
        </p>
      )}

      {/* Action Buttons */}
      <div className="mb-3 d-flex flex-wrap gap-2">
        <CButton color="primary" className="me-2" onClick={() => setShowCommentInput(!showCommentInput)}>
          <CIcon icon={cilCommentBubble} className="me-1"/> Add Comment
        </CButton>
        <CButton color="warning" onClick={() => handleUpdateTicketState('pending')} disabled={isUpdatingState}>
          <CIcon icon={cilWarning} className="me-1" /> Send to Triage
        </CButton>
        <CButton color="success" onClick={() => handleUpdateTicketState('completed')} disabled={isUpdatingState}>
          <CIcon icon={cilCheckCircle} className="me-1" /> Triage Complete
        </CButton>
        <CButton color="info" onClick={() => handleUpdateTicketState('moreInfo')} disabled={isUpdatingState}>
          <CIcon icon={cilInfo} className="me-1" /> More Info Needed
        </CButton>
        <CButton
          color="danger"
          onClick={() => handleUpdateTicketState('rejected')}
          disabled={isUpdatingState}
        >
          <CIcon icon={cilBan} className="me-1" /> Reject
        </CButton>
        <CButton
          color="danger"
          onClick={() => handleUpdateTicketState('nri')}
          disabled={isUpdatingState}
        >
          Not RCCL Issue
        </CButton>
        <CButton
          color="secondary"
          href={jiraConfigUrl && jiraConfigUrl !== '#' && selectedTicketKey ? `${jiraConfigUrl}/browse/${selectedTicketKey}` : '#'}
          target="_blank"
          rel="noopener noreferrer"
          disabled={!jiraConfigUrl || jiraConfigUrl === '#' || !selectedTicketKey}
          component="a"
        >
          Go to ticket
        </CButton>
        <CButton color="light" disabled>
          <CIcon icon={cilReload} className="me-1" /> Refresh
        </CButton>
      </div>

      {/* Conditional Comment Input Area */}
      {showCommentInput && (
        <div className="mt-3 border-top pt-3">
          <CFormTextarea
            rows={3}
            placeholder="Enter your comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isAddingComment}
          />
          <div className="mt-2 d-flex align-items-center">
            <CButton color="success" size="sm" onClick={handleAddComment} disabled={isAddingComment || !newComment?.trim()}>
              {isAddingComment ? <CSpinner size="sm" className="me-1"/> : null}
              Submit Comment
            </CButton>
            {addCommentSuccess && <CAlert color="success" className="d-inline-block p-1 ms-2 mb-0">Comment added!</CAlert>}
            {addCommentError && <CAlert color="danger" className="d-inline-block p-1 ms-2 mb-0">Error: {addCommentError}</CAlert>}
          </div>
        </div>
      )}

      {/* Status Messages for State Update */}
      {isUpdatingState && <CSpinner size="sm" className="me-2"/>}
      {updateStateSuccess && <CAlert color="success" className="d-inline-block p-2">State updated successfully!</CAlert>}
      {updateStateError && <CAlert color="danger" className="d-inline-block p-2">Error: {updateStateError}</CAlert>}

      <h5 className="mt-4">Comments</h5>
      {commentLoading && (
        <div className="text-center">
          <CSpinner color="primary" />
          <p>Loading comments...</p>
        </div>
      )}
      {commentError && (
        <p className="text-danger">Error loading comments: {commentError}</p>
      )}
      {!commentLoading && !commentError && (
        <>
          {selectedTicketComments.length > 0 ? (
            selectedTicketComments.map((comment) => (
              <CCard key={comment.id} className="mb-2">
                <CCardBody className="p-2">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="fw-bold">{comment.author?.displayName || 'Unknown User'}</small>
                    <small className="text-muted">
                      {comment.created ? formatDistanceToNow(new Date(comment.created), { addSuffix: true }) : ''}
                    </small>
                  </div>
                  {/* Render comment body as HTML. Assumes Jira provides sanitized HTML. */}
                  {/* If body is Atlassian Document Format (ADF), a specific renderer would be needed. */}
                  <div dangerouslySetInnerHTML={{ __html: comment.body || '' }}></div>
                </CCardBody>
              </CCard>
            ))
          ) : (
            <p className="text-muted">No comments to display.</p>
          )}
        </>
      )}
    </COffcanvasBody>
  );
};

export default TicketDetailPanel; 