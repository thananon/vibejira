const express = require('express');
const cors = require('cors');
const config = require('./config');
const apiRouter = require('./routes');

const app = express();

// Basic Middleware
app.use(cors({ 
  origin: config.frontendOrigin,
}));
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
app.listen(config.port, '0.0.0.0', () => {
  console.log(`Server listening on port ${config.port} (IPv4/IPv6)`);
  console.log(`Allowed frontend origin: ${config.frontendOrigin}`);
}); 