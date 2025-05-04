const config = require('../config');

// Controller to expose specific configuration values to the frontend
exports.getConfig = (req, res) => {
  // Only expose non-sensitive config values needed by the frontend
  res.json({
    jiraBaseUrl: config.jiraBaseUrl || null // Send null if not configured
  });
}; 