const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initializeDatabase } = require('./config/db');

const app = express();

// Standard middlewares
app.use(cors());
app.use(express.json());

// Main Root / Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    message: 'Premium School Management API is working perfectly!',
    timestamp: new Date()
  });
});

// Register routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/homework', require('./routes/homework'));
app.use('/api/parent', require('./routes/parent'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error occurred.' });
});

const PORT = process.env.PORT || 5000;

// Initialize Database first, then boot server
async function startServer() {
  console.log('Initializing premium database components...');
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🚀 API Base URL: http://localhost:${PORT}/api`);
    console.log(`===================================================`);
  });
}

startServer();
