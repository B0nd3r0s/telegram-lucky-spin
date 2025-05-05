
// Load environment variables from .env file first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with proper error handling
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('Successfully connected to Supabase');

// Import routes
const authRoutes = require('./src/routes/auth');
const casesRoutes = require('./src/routes/cases');
const userRoutes = require('./src/routes/user');
const transactionsRoutes = require('./src/routes/transactions');
const liveWinsRoutes = require('./src/routes/liveWins');
const ratingsRoutes = require('./src/routes/ratings');
const referralsRoutes = require('./src/routes/referrals');
const adminRoutes = require('./src/routes/admin');

// Import middleware
const { authenticateToken } = require('./src/middleware/auth');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON
app.use(morgan('dev')); // Logging

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', apiLimiter);

// Make Supabase client available to all routes
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/transactions', authenticateToken, transactionsRoutes);
app.use('/api/live-wins', liveWinsRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/referrals', authenticateToken, referralsRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 route
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing
