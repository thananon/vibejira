import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const useSidebar = (jiraConfigUrl, onTicketUpdate) => { // onTicketUpdate is a callback to refresh main ticket list, e.g., fetchTickets from useJiraTickets
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedTicketKey, setSelectedTicketKey] = useState(null);
  const [selectedTicketData, setSelectedTicketData] = useState(null);
  const [selectedTicketComments, setSelectedTicketComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState(null);

  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const [updateStateError, setUpdateStateError] = useState(null);
  const [updateStateSuccess, setUpdateStateSuccess] = useState(false);

  const [showCommentInput, setShowCommentInput] = useState(false);
  const [newComment, setNewComment] = useState(''); // Assuming plain text for now; would change for rich text editor
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [addCommentError, setAddCommentError] = useState(null);
  const [addCommentSuccess, setAddCommentSuccess] = useState(false);

  // State for Technical Evaluation
  const [techEvalContent, setTechEvalContent] = useState('');
  const [isUpdatingTechEval, setIsUpdatingTechEval] = useState(false);
  const [updateTechEvalError, setUpdateTechEvalError] = useState(null);
  const [updateTechEvalSuccess, setUpdateTechEvalSuccess] = useState(false);

  const fetchComments = useCallback(async (issueKey) => {
    if (!issueKey) return;
    setCommentLoading(true);
    setCommentError(null);
    setSelectedTicketComments([]);
    try {
      const url = `${API_BASE_URL}/api/tickets/${issueKey}/comments`;
      console.log(`Fetching comments from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to fetch comments'}`);
      }
      const data = await response.json();
      if (data && Array.isArray(data.comments)) {
        setSelectedTicketComments(data.comments);
      } else {
        throw new Error('Received unexpected comments structure from API.');
      }
    } catch (err) {
      console.error('Fetch comments error:', err);
      setCommentError(err.message);
    } finally {
      setCommentLoading(false);
    }
  }, []);

  const handleRowClick = useCallback((ticket) => {
    setSelectedTicketKey(ticket.key);
    setSelectedTicketData(ticket);
    setSidebarVisible(true);
    fetchComments(ticket.key);
    // Reset sidebar-specific states
    setUpdateStateSuccess(false);
    setUpdateStateError(null);
    setAddCommentSuccess(false);
    setAddCommentError(null);
    setShowCommentInput(false);
    setNewComment('');
    // Reset Technical Evaluation states
    setTechEvalContent('');
    setUpdateTechEvalError(null);
    setUpdateTechEvalSuccess(false);
    setIsUpdatingTechEval(false); // Ensure loading state is also reset
  }, [fetchComments]);

  const handleUpdateTicketState = useCallback(async (newState) => {
    if (!selectedTicketKey) return;
    setIsUpdatingState(true);
    setUpdateStateError(null);
    setUpdateStateSuccess(false);
    try {
      const url = `${API_BASE_URL}/api/tickets/${selectedTicketKey}/state`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetState: newState }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to update state'}`);
      }
      setUpdateStateSuccess(true);
      if (onTicketUpdate) onTicketUpdate(); // Call to refresh main ticket list
      fetchComments(selectedTicketKey); // Re-fetch comments for the current ticket
      setTimeout(() => setUpdateStateSuccess(false), 3000);
    } catch (err) {
      console.error(`Error updating state to ${newState}:`, err);
      setUpdateStateError(err.message);
      setTimeout(() => setUpdateStateError(null), 5000);
    } finally {
      setIsUpdatingState(false);
    }
  }, [selectedTicketKey, onTicketUpdate, fetchComments]);

  const handleAddComment = useCallback(async () => {
    if (!selectedTicketKey || !newComment.trim()) return;
    setIsAddingComment(true);
    setAddCommentError(null);
    setAddCommentSuccess(false);
    try {
      const url = `${API_BASE_URL}/api/tickets/${selectedTicketKey}/comments`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newComment }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to add comment'}`);
      }
      setAddCommentSuccess(true);
      setNewComment('');
      setShowCommentInput(false);
      fetchComments(selectedTicketKey);
      // Optionally: if (onTicketUpdate) onTicketUpdate(); // If adding a comment might affect main list criteria
      setTimeout(() => setAddCommentSuccess(false), 3000);
    } catch (err) {
      console.error(`Error adding comment:`, err);
      setAddCommentError(err.message);
      setTimeout(() => setAddCommentError(null), 5000);
    } finally {
      setIsAddingComment(false);
    }
  }, [selectedTicketKey, newComment, fetchComments /*, onTicketUpdate */]);

  const handleUpdateTechEvaluation = useCallback(async (content) => {
    if (!selectedTicketKey) return;
    setIsUpdatingTechEval(true);
    setUpdateTechEvalError(null);
    setUpdateTechEvalSuccess(false);
    try {
      const url = `${API_BASE_URL}/api/tickets/${selectedTicketKey}/field`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldId: 'customfield_16104', value: content }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to update technical evaluation'}`);
      }
      setUpdateTechEvalSuccess(true);
      // Optionally, refresh main ticket list or selected ticket data if the backend returns the updated ticket
      // if (onTicketUpdate) onTicketUpdate(); 
      // For now, just re-fetch the selected ticket data to get the updated field
      if (selectedTicketData) {
          const updatedTicketData = {
              ...selectedTicketData,
              fields: {
                  ...selectedTicketData.fields,
                  "customfield_16104": content,
              }
          };
          setSelectedTicketData(updatedTicketData);
      }
      setTimeout(() => {
        setUpdateTechEvalSuccess(false);
      }, 3000);
    } catch (err) {
      console.error(`Error updating technical evaluation:`, err);
      setUpdateTechEvalError(err.message);
      setTimeout(() => setUpdateTechEvalError(null), 5000);
    } finally {
      setIsUpdatingTechEval(false);
    }
  }, [selectedTicketKey, selectedTicketData /*, onTicketUpdate */]);

  const closeSidebar = useCallback(() => {
    setSidebarVisible(false);
  }, []);

  return {
    sidebarVisible,
    setSidebarVisible, // Expose setter if direct control needed, or rely on handleRowClick/closeSidebar
    selectedTicketKey,
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
    handleRowClick, 
    handleUpdateTicketState,
    handleAddComment,
    fetchComments, // Expose if needed by panel itself for refresh
    closeSidebar,
    // Expose Technical Evaluation states and handler
    techEvalContent,
    setTechEvalContent,
    isUpdatingTechEval,
    updateTechEvalError,
    updateTechEvalSuccess,
    handleUpdateTechEvaluation,
  };
}; 