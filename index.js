const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');
const fs = require('fs');
const cron = require('node-cron');
const { User, ScanHistory } = require('./src/models/index');
const ensureStorageDirectories = require('./src/utils/ensureStorage');

// Load environment variables
dotenv.config();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'src/logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'src/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info('Created uploads directory');
}

// Initialize express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create the public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  logger.info('Created public directory');
}

// Serve static files from the public directory
app.use(express.static(publicDir));

// Log all requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Initialize Redis
let redisAvailable = false;
try {
  const redis = require('./src/config/redis');
  if (redis && redis.client) {
    redisAvailable = true;
    logger.info('Redis initialized and available');
  } else {
    logger.warn('Redis client initialized but may not be available');
  }
} catch (error) {
  logger.error(`Redis initialization failed: ${error.message}`);
  logger.warn('Application will continue without Redis support');
}

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/documents', require('./src/routes/documentRoutes'));
app.use('/api/credits', require('./src/routes/creditRoutes'));
app.use('/api/admin', require('./src/routes/analyticsRoutes'));

// Serve HTML files from the html directory
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

// Handle routes for other HTML files
app.get('/:page', (req, res) => {
  const page = req.params.page;
  const htmlFile = page.endsWith('.html') ? page : `${page}.html`;
  const filePath = path.join(__dirname, 'public', 'html', htmlFile);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // If page doesn't exist, redirect to 404 or home
    res.status(404).sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
  }
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  logger.error(err.stack);
  
  return res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// Connect to database and start server
logger.info('Connecting to MongoDB...');
connectDB()
  .then(() => {
    // Start server only after successful DB connection
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
    
    // Schedule daily credit reset
    logger.info('Setting up daily credit reset cron job');
    cron.schedule('0 0 * * *', async () => {
      try {
        logger.info('Running daily credit reset...');
        const result = await User.updateMany({}, { 
          $set: { 
            credits: process.env.DAILY_FREE_CREDITS || 20,
            lastCreditReset: new Date()
          } 
        });
        logger.info(`Credits reset successfully for ${result.modifiedCount} users`);
      } catch (error) {
        logger.error(`Error resetting credits: ${error.message}`);
      }
    });

    // Ensure storage directories
    ensureStorageDirectories();
  })
  .catch(err => {
    logger.error(`Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  
  // Close Redis connection if it exists
  if (redisAvailable) {
    try {
      const redis = require('./src/config/redis');
      if (redis && redis.client) {
        await redis.client.quit().catch(err => {
          logger.error(`Error during Redis quit: ${err.message}`);
        });
        logger.info('Redis connection closed');
      }
    } catch (error) {
      logger.error(`Error closing Redis connection: ${error.message}`);
    }
  }
  
  // Close MongoDB connection
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
  }
  
  logger.info('All connections closed, exiting...');
  process.exit(0);
}); 