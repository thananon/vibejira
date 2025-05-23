const express = require('express');
const ticketController = require('../controllers/ticketController');

const router = express.Router();

// Route to get dashboard summary data (top cards)
router.get('/summary', ticketController.getDashboardSummary);

// Route to search/filter tickets
router.get('/', ticketController.searchTickets);

// Route to get comments for a specific ticket
router.get('/:issueKey/comments', ticketController.getComments);

// Route to add a comment to a specific ticket
router.post('/:issueKey/comments', ticketController.addComment);

// Route to add a label to a specific ticket
router.put('/:issueKey/labels', ticketController.addLabel);

// Route to get history for a specific ticket
router.get('/:issueKey/history', ticketController.getHistory);

// Route to update the state label for a specific ticket
router.put('/:issueKey/state', ticketController.updateTicketState);

// Route to update a generic field on a specific ticket
router.put('/:issueKey/field', ticketController.updateTicketField);

module.exports = router; 