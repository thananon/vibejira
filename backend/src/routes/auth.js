const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Redirects user to JIRA for authorization
router.get('/jira', authController.redirectToJira);

// Handles the callback from JIRA after authorization
router.get('/jira/callback', authController.handleJiraCallback);

// Endpoint for frontend to check authentication status
router.get('/status', authController.checkAuthStatus); // Note: This is /auth/status, not /api/auth/status

// Endpoint to log out user
router.post('/logout', authController.logout); // Note: This is /auth/logout, not /api/auth/logout

module.exports = router; 