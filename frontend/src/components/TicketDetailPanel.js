import React, { useState, useEffect } from 'react';
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
  cilPencil,
} from '@coreui/icons';
import { formatDistanceToNow } from 'date-fns';
import { formatJiraComment } from '../utils/jiraCommentFormatter';

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
  techEvalContent,
  setTechEvalContent,
  isUpdatingTechEval,
  updateTechEvalError,
  updateTechEvalSuccess,
  handleUpdateTechEvaluation,
  // fetchComments // Not passed for now, assuming parent (useSidebar) handles re-fetching needed comments
}) => {

  const technicalEvaluationFieldId = 'customfield_16104';
  const [isEditingTechEval, setIsEditingTechEval] = useState(false);
  const [originalTechEvalContentForCancel, setOriginalTechEvalContentForCancel] = useState('');

  // Effect to initialize/reset tech eval content and edit state on ticket change
  useEffect(() => {
    const currentContent = selectedTicketData?.fields?.[technicalEvaluationFieldId] || '';
    setTechEvalContent(currentContent); // Update content in parent via prop
    setOriginalTechEvalContentForCancel(currentContent); // Store for cancel
    setIsEditingTechEval(false); // Ensure not in edit mode
  }, [selectedTicketData, technicalEvaluationFieldId, setTechEvalContent]);

  // Effect to exit edit mode on successful save
  useEffect(() => {
    if (updateTechEvalSuccess && isEditingTechEval) {
      setIsEditingTechEval(false);
      // The success message is handled by existing props and CAlert
    }
  }, [updateTechEvalSuccess, isEditingTechEval]);

  const handleEditTechEval = () => {
    setOriginalTechEvalContentForCancel(techEvalContent); // Save current content before editing
    setIsEditingTechEval(true);
  };

  const handleSaveTechEval = () => {
    handleUpdateTechEvaluation(techEvalContent); // Call prop to save
    // useEffect will handle setIsEditingTechEval(false) on success
  };

  const handleCancelEditTechEval = () => {
    setTechEvalContent(originalTechEvalContentForCancel); // Revert to original content via prop
    setIsEditingTechEval(false);
  };

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

      {/* New Always-Visible Technical Evaluation Section */}
      <div className="mb-3 border-top pt-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Technical Evaluation</h5>
          {!isEditingTechEval ? (
            <CButton color="secondary" size="sm" onClick={handleEditTechEval}>
              <CIcon icon={cilPencil} className="me-1"/> Edit
            </CButton>
          ) : (
            <div className="d-flex gap-2 align-items-center">
              <CButton 
                color="success" 
                size="sm" 
                onClick={handleSaveTechEval} 
                disabled={isUpdatingTechEval || typeof techEvalContent !== 'string' || techEvalContent === originalTechEvalContentForCancel}
              >
                {isUpdatingTechEval ? <CSpinner size="sm" className="me-1"/> : null}
                Save
              </CButton>
              <CButton color="light" size="sm" onClick={handleCancelEditTechEval} disabled={isUpdatingTechEval}>
                Cancel
              </CButton>
            </div>
          )}
        </div>
        <CFormTextarea
          rows={5}
          placeholder="Enter technical evaluation..."
          value={techEvalContent}
          onChange={(e) => setTechEvalContent(e.target.value)}
          disabled={!isEditingTechEval || isUpdatingTechEval}
        />
        {/* Displaying error/success messages related to Tech Eval Update */}
        {isUpdatingTechEval && !isEditingTechEval && <CSpinner size="sm" className="me-2"/> /* Show spinner if updating but not in edit mode (e.g. initial load) - might be rare here */}
        {updateTechEvalSuccess && !isEditingTechEval && (
          <CAlert color="success" className="d-inline-block p-1 mt-2 mb-0">
            Evaluation updated!
          </CAlert>
        )}
        {updateTechEvalError && (
            <CAlert color="danger" className="d-inline-block p-1 mt-2 mb-0">
                Error: {updateTechEvalError}
            </CAlert>
        )}
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
                  {/* Process and render comment body with proper formatting */}
                  <div className="comment-content" dangerouslySetInnerHTML={{ __html:  formatJiraComment(comment.body) }}></div>
                </CCardBody>
              </CCard>
            ))
          ) : (
            <p className="text-muted">No comments to display.</p>
          )}
        </>
      )}

      {/* Status Messages for State Update */}
      {isUpdatingState && <CSpinner size="sm" className="me-2"/>}
      {updateStateSuccess && <CAlert color="success" className="d-inline-block p-2">State updated successfully!</CAlert>}
      {updateStateError && <CAlert color="danger" className="d-inline-block p-2">Error: {updateStateError}</CAlert>}
    </COffcanvasBody>
  );
};

export default TicketDetailPanel; 