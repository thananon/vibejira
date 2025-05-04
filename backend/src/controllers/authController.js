const axios = require('axios');
const config = require('../config');

// --- Helper: Build JIRA Authorization URL ---
const getJiraAuthUrl = () => {
  if (!config.jiraBaseUrl || !config.jiraClientId || !config.jiraCallbackUrl) {
    console.error('JIRA OAuth environment variables not configured!');
    return null;
  }

  const params = new URLSearchParams({
    audience: 'api.atlassian.com',
    client_id: config.jiraClientId,
    scope: 'read:jira-user read:jira-work write:jira-work offline_access', // Adjust scopes as needed
    redirect_uri: config.jiraCallbackUrl,
    state: 'your-secure-random-state', // TODO: Generate and validate a proper state parameter
    response_type: 'code',
    prompt: 'consent',
  });

  return `${config.jiraBaseUrl}/authorize?${params.toString()}`;
};

// --- Controller Functions ---

exports.redirectToJira = (req, res) => {
  const authUrl = getJiraAuthUrl();
  if (authUrl) {
    res.redirect(authUrl);
  } else {
    res.status(500).send('JIRA OAuth configuration error.');
  }
};

exports.handleJiraCallback = async (req, res, next) => {
  const { code, state } = req.query;
  const error = req.query.error;

  if (error) {
    console.error('JIRA OAuth Error:', error);
    return res.redirect(`${config.frontendUrl}/login?error=${encodeURIComponent(error)}`);
  }

  // TODO: Validate the 'state' parameter here against a value stored in the session before the redirect

  if (!code) {
    return res.redirect(`${config.frontendUrl}/login?error=missing_code`);
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await axios.post(`${config.jiraBaseUrl}/oauth/token`, {
      grant_type: 'authorization_code',
      client_id: config.jiraClientId,
      client_secret: config.jiraClientSecret,
      code: code,
      redirect_uri: config.jiraCallbackUrl,
    });

    const tokens = tokenResponse.data; // { access_token, refresh_token, expires_in, scope }

    // Fetch user profile (optional, but good for identifying user)
    const profileResponse = await axios.get('https://api.atlassian.com/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = profileResponse.data; // { account_id, email, name, picture, etc. }

    // Store tokens and profile in session
    req.session.regenerate((err) => { // Regenerate session ID for security
      if (err) return next(err);

      req.session.jiraAuth = {
        tokens: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: Date.now() + tokens.expires_in * 1000,
          scope: tokens.scope,
        },
        profile: {
          id: profile.account_id,
          name: profile.name,
          email: profile.email,
          picture: profile.picture,
        }
      };

      // Save the session before redirecting
      req.session.save((err) => {
        if (err) return next(err);
        // Redirect back to the frontend dashboard
        res.redirect(config.frontendUrl); // Adjust path if needed (e.g., /dashboard)
      });
    });

  } catch (error) {
    console.error('Error handling JIRA callback:', error.response ? error.response.data : error.message);
    // Pass error to the error handler middleware
    const err = new Error('Failed to authenticate with JIRA.');
    err.status = 500;
    next(err); 
    // Or redirect with error: return res.redirect(`${config.frontendUrl}/login?error=token_exchange_failed`);
  }
};

exports.checkAuthStatus = (req, res) => {
  if (req.session && req.session.jiraAuth && req.session.jiraAuth.tokens) {
    // Optionally add check for token expiry here if needed on frontend
    res.json({
      isAuthenticated: true,
      user: req.session.jiraAuth.profile || null,
    });
  } else {
    res.json({ isAuthenticated: false, user: null });
  }
};

exports.logout = (req, res, next) => {
  // TODO: Optionally call JIRA API to revoke refresh token if possible/needed

  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return next(new Error('Failed to log out.'));
    }
    // Clears the cookie on the client
    res.clearCookie('connect.sid'); // Use the session cookie name (default is connect.sid)
    res.status(200).json({ message: 'Logout successful' });
  });
}; 