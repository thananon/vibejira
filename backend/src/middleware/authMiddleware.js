const config = require('../config');

// Middleware to check if user is authenticated via JIRA session
const requireAuth = async (req, res, next) => {
  if (!req.session || !req.session.jiraAuth || !req.session.jiraAuth.tokens) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const { tokens } = req.session.jiraAuth;
  const now = Date.now();

  // Check if access token is expired
  if (now >= tokens.expiresAt) {
    // --- TODO: Implement Token Refresh Logic --- 
    // 1. Check if refreshToken exists
    // 2. Make POST request to config.jiraBaseUrl/oauth/token with grant_type: 'refresh_token'
    // 3. Use the refreshToken, client_id, client_secret
    // 4. If successful, update req.session.jiraAuth.tokens with new accessToken, expiresIn, etc.
    // 5. Save the session: req.session.save(...)
    // 6. If refresh fails, destroy session and return 401
    
    console.warn('JIRA token expired, refresh needed (not implemented yet).');
    // For now, deny access if token is expired
    req.session.destroy((err) => { // Destroy session if token is expired and refresh fails/not implemented
       if (err) console.error("Error destroying session during token expiry check", err);
       res.clearCookie('connect.sid');
       return res.status(401).json({ message: 'Session expired. Please log in again.' });
    });
    return; // Prevent next() from being called until session is destroyed
  }

  // Attach access token to request object for use in controllers/services
  req.accessToken = tokens.accessToken;
  next(); // User is authenticated, proceed to the next middleware/route handler
};

module.exports = { requireAuth }; 