const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

// GET /api/health - Check the health of the application and its dependencies
router.get('/', healthController.checkHealth);

module.exports = router;
