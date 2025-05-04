const express = require('express');
const session = require('express-session');
const cors = require('cors');
const config = require('./config');
const apiRouter = require('./routes');
const authRouter = require('./routes/auth'); // Separate auth routes for non-API prefix

const app = express();

// Basic Middleware
app.use(cors({ 
  origin: config.frontendOrigin, // Allow requests from frontend
  credentials: true // Allow cookies to be sent
}));
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Session Configuration (Using MemoryStore by default)
if (!config.sessionSecret) {
  console.error('ERROR: SESSION_SECRET environment variable is not set.');
  process.exit(1);
}
app.use(session({
  secret: config.sessionSecret,
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create session until something stored
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true, // Prevent client-side JS from reading the cookie
    maxAge: 1000 * 60 * 60 * 24 // Cookie expiry: 1 day 
  }
}));

// --- Routes --- 
// Auth routes (don't require /api prefix or auth middleware)
app.use('/auth', authRouter);

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
    // Optionally include stack trace in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// --- Start Server --- 
app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
  console.log(`Allowed frontend origin: ${config.frontendOrigin}`);
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Using default MemoryStore for sessions - not suitable for production.');
  }
}); 