import { useState, useCallback } from 'react';

// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001'; // Not needed

export const useSidebar = (jiraConfigUrl, onTicketUpdate) => {
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
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [addCommentError, setAddCommentError] = useState(null);
  const [addCommentSuccess, setAddCommentSuccess] = useState(false);

  const fetchComments = useCallback(async (issueKey) => {
    if (!issueKey) return;
    setCommentLoading(true);
    setCommentError(null);
    // In mock mode, comments are part of selectedTicketData
    if (selectedTicketData && selectedTicketData.comments) {
      setSelectedTicketComments(selectedTicketData.comments);
    } else {
      setSelectedTicketComments([]); // Should not happen if mock data is correct
    }
    setCommentLoading(false);
  }, [selectedTicketData]); // Depend on selectedTicketData to get comments

  const handleRowClick = useCallback((ticket) => {
    setSelectedTicketKey(ticket.key);
    setSelectedTicketData(ticket); // This ticket object from mockData.js should include its comments
    setSidebarVisible(true);
    // fetchComments will now use comments from the ticket object
    if (ticket && ticket.comments) {
      setSelectedTicketComments(ticket.comments);
    } else {
      setSelectedTicketComments([]);
    }
    setCommentLoading(false); // No actual fetching
    setCommentError(null);
    
    // Reset sidebar-specific states
    setUpdateStateSuccess(false);
    setUpdateStateError(null);
    setAddCommentSuccess(false);
    setAddCommentError(null);
    setShowCommentInput(false);
    setNewComment('');
  }, []); // Removed fetchComments from deps as it now uses state already set here

  const handleUpdateTicketState = useCallback(async (newState) => {
    if (!selectedTicketKey) return;
    console.log(`MOCK MODE: Update ticket ${selectedTicketKey} to state ${newState} - No actual update.`);
    setIsUpdatingState(true);
    setUpdateStateError(null);
    // Simulate a successful update for UI feedback, but don't call onTicketUpdate
    // as no real data change has happened that needs a list refresh.
    setTimeout(() => {
        setUpdateStateSuccess(true);
        setIsUpdatingState(false);
        setTimeout(() => setUpdateStateSuccess(false), 2000); // Hide success message after a bit
    }, 500);
    // No actual API call
    // No onTicketUpdate(); // No need to refresh main list for mock
  }, [selectedTicketKey]);

  const handleAddComment = useCallback(async () => {
    if (!selectedTicketKey || !newComment.trim()) return;
    console.log(`MOCK MODE: Add comment to ${selectedTicketKey}: "${newComment}" - No actual update.`);
    setIsAddingComment(true);
    setAddCommentError(null);
    // Simulate a successful add for UI feedback
    setTimeout(() => {
        setAddCommentSuccess(true);
        // OPTIONAL: Add to local display for demo, but it won't persist
        // const tempComment = {
        //   id: `temp-${Date.now()}`,
        //   author: { displayName: 'You (Mock)' },
        //   body: newComment,
        //   created: new Date().toISOString(),
        // };
        // setSelectedTicketComments(prev => [tempComment, ...prev]);
        setNewComment('');
        setShowCommentInput(false);
        setIsAddingComment(false);
        setTimeout(() => setAddCommentSuccess(false), 2000); // Hide success message
    }, 500);
    // No actual API call
    // No fetchComments(selectedTicketKey); // Comments are static in mockData
  }, [selectedTicketKey, newComment]);

  const closeSidebar = useCallback(() => {
    setSidebarVisible(false);
  }, []);

  return {
    sidebarVisible,
    setSidebarVisible,
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
    // fetchComments, // No longer needed to be exposed as it's handled internally
    closeSidebar
  };
}; 