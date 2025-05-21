const express = require('express');
const cors = require('cors');
const config = require('./config');
const apiRouter = require('./routes');
const jiraService = require('./services/jiraService');

const app = express();

// Basic Middleware
// Apply CORS middleware
if (config.frontendOrigin) {
  app.use(cors({ origin: config.frontendOrigin }));
} else {
  console.warn('WARNING: FRONTEND_ORIGIN is not defined in environment variables. CORS will allow all origins. This is insecure for production.');
  // Fallback to allow all origins if not defined, to prevent breaking development if .env is missing
  // For a production environment, you might want a stricter fallback or to prevent startup.
  app.use(cors()); 
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes --- 
// API routes (require /api prefix)
app.use('/api', apiRouter);

// Basic Root Route (optional)
app.get('/', (req, res) => {
  res.send('VibeJira Backend is running!');
});

// --- Error Handling --- 
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// --- Start Server --- 
// Explicitly specify host '0.0.0.0' to listen on all IPv4 and IPv6 interfaces 
// if available, making it accessible via localhost, 127.0.0.1, and network IPs.
app.listen(config.port, async () => {
  console.log(`Server listening on port ${config.port} (IPv4/IPv6)`);
  console.log(`Allowed frontend origin: ${config.frontendOrigin}`);
  
  // Run JIRA API sanity check only in debug mode
  if (process.env.JIRA_API_DEBUG === 'true') {
    console.log('\n[DEBUG] Running JIRA API sanity check...');
    try {
      await jiraService.getMyself();
      // Success is implicitly logged by the response interceptor
      console.log('[DEBUG] JIRA API sanity check successful.');
    } catch (error) {
      console.warn('\n*******************************************');
      console.warn('*** [DEBUG] JIRA API SANITY CHECK FAILED! ***');
      console.warn('*******************************************');
      console.warn('Potential Causes:');
      console.warn('- Invalid or expired JIRA_PAT in .env file');
      console.warn('- Incorrect JIRA_BASE_URL in .env file');
      console.warn('- Network connectivity issue to JIRA instance');
      console.warn('- PAT does not have permission to access /rest/api/3/myself');
      console.warn('Error Details:', error.message);
      console.warn('*******************************************\n');
    }
  }
  // The MemoryStore warning was here. It has been removed as sessions are not actively used.
  // If sessions were to be implemented, a proper session store would be required for production.
}); 