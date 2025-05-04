const express = require('express');
const ticketRoutes = require('./tickets');
const authRoutes = require('./auth'); // We might need auth status under /api too

const router = express.Router();

// Mount ticket-related routes under /api/tickets
router.use('/tickets', ticketRoutes);

// Optional: Mount a route for auth status under /api for consistency if needed by frontend
// This allows checking status using the same /api base and auth middleware if desired
// router.get('/auth/status', authController.checkAuthStatus); // Requires importing authController

// Add other API route modules here if needed
// router.use('/users', userRoutes);

module.exports = router; 