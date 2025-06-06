
// Load environment variables from .env file first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

// Import routes
const authRoutes = require('./src/routes/auth');
const casesRoutes = require('./src/routes/cases');
const userRoutes = require('./src/routes/user');
const transactionsRoutes = require('./src/routes/transactions');
const liveWinsRoutes = require('./src/routes/liveWins');
const ratingsRoutes = require('./src/routes/ratings');
const referralsRoutes = require('./src/routes/referrals');
const adminRoutes = require('./src/routes/admin');
const upgradeRoutes = require('./src/routes/upgrade');

// Import middleware
const { authenticateToken } = require('./src/middleware/auth');
const errorHandler = require('./src/middleware/errorHandler');

// Initialize Telegram prices update scheduler
const { scheduleAutoUpdate } = require('./src/utils/telegramUtils');
const { updatePrices } = require('./src/controllers/adminController');

// Schedule automatic price updates
scheduleAutoUpdate(updatePrices);

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/transactions', authenticateToken, transactionsRoutes);
app.use('/api/live-wins', liveWinsRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/referrals', authenticateToken, referralsRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/upgrade', authenticateToken, upgradeRoutes);

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
