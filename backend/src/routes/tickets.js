const express = require('express');
const { query, body, param, validationResult } = require('express-validator');
const ticketController = require('../controllers/ticketController');
const { TICKET_STATES_VALID_ARRAY } = require('../config/jiraConstants');

const router = express.Router();

// --- Validation Middleware Helper ---
// This helper will be called at the beginning of each controller function
// that has validation defined in this routes file.
const createValidationMiddleware = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array() });
  };
};

// --- Route Definitions with Validation ---

// Common validation for issueKey URL parameter
const validateIssueKeyParam = [
  param('issueKey').isString().trim().notEmpty().matches(/^[A-Z]+-\d+$/)
    .withMessage('issueKey must be a valid JIRA issue key format (e.g., PROJECT-123).'),
];

// Route to get dashboard summary data (top cards)
router.get('/summary', 
  createValidationMiddleware([
    query('selectedDateFilter').optional().isIn(['week', 'month', 'range']).withMessage('Invalid selectedDateFilter. Must be one of: week, month, range.'),
    query('startDate').optional().if(query('selectedDateFilter').equals('range')).isISO8601().toDate().withMessage('Invalid startDate for range. Must be a valid ISO8601 date.'),
    query('endDate').optional().if(query('selectedDateFilter').equals('range')).isISO8601().toDate().withMessage('Invalid endDate for range.')
      .custom((value, { req }) => {
        if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
          throw new Error('endDate must be on or after startDate for range filter.');
        }
        return true;
      }),
    query('activeAssigneeFilter').optional().isString().trim().escape().notEmpty().withMessage('activeAssigneeFilter must be a non-empty string if provided.'),
  ]), 
  ticketController.getDashboardSummary
);

// Route to search/filter tickets (Note: searchTickets is on GET /)
router.get('/', 
  createValidationMiddleware([
    query('jql').optional().isString().trim().notEmpty().withMessage('JQL query must be a non-empty string if provided.'),
    query('filter').optional().isString().trim().escape().notEmpty().withMessage('Filter must be a non-empty string if provided.'),
    query('fields').optional().isString().trim().escape().notEmpty().withMessage('Fields must be a non-empty string if provided.'),
    query('startAt').optional().isInt({ min: 0 }).withMessage('startAt must be a non-negative integer.'),
    query('maxResults').optional().isInt({ min: 1, max: 100 }).withMessage('maxResults must be an integer between 1 and 100.'),
  ]), 
  ticketController.searchTickets
);

// Route to get comments for a specific ticket
router.get('/:issueKey/comments', 
  createValidationMiddleware(validateIssueKeyParam), 
  ticketController.getComments
);

// Route to add a comment to a specific ticket
router.post('/:issueKey/comments', 
  createValidationMiddleware([
    ...validateIssueKeyParam,
    body('body').isString().trim().notEmpty().withMessage('Comment body is required and cannot be empty.'),
  ]), 
  ticketController.addComment
);

// Route to add a label to a specific ticket
router.put('/:issueKey/labels', 
  createValidationMiddleware([
    ...validateIssueKeyParam,
    body('label').isString().trim().notEmpty().matches(/^[\w-]+$/)
      .withMessage('Label is required, cannot be empty, and should not contain spaces or special characters other than hyphens/underscores.'),
  ]), 
  ticketController.addLabel
);

// Route to get history for a specific ticket
router.get('/:issueKey/history', 
  createValidationMiddleware(validateIssueKeyParam), 
  ticketController.getHistory
);

// Route to update the state label for a specific ticket
router.put('/:issueKey/state', 
  createValidationMiddleware([
    ...validateIssueKeyParam,
    body('targetState').isString().trim().notEmpty().isIn(TICKET_STATES_VALID_ARRAY)
      .withMessage(`targetState is required and must be one of: ${TICKET_STATES_VALID_ARRAY.join(', ')}.`),
  ]), 
  ticketController.updateTicketState
);

// Route to update a generic field on a specific ticket
router.put('/:issueKey/field', 
  createValidationMiddleware([
    ...validateIssueKeyParam,
    body('fieldId').isString().trim().escape().notEmpty().withMessage('fieldId is required and cannot be empty.'),
    body('value').exists().withMessage('value is required for the field. To clear a field, provide an empty string or null where appropriate for the field type.'),
  ]), 
  ticketController.updateTicketField
);

module.exports = router;