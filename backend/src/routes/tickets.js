const express = require('express');
const ticketController = require('../controllers/ticketController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all ticket routes
router.use(requireAuth);

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


module.exports = router; 