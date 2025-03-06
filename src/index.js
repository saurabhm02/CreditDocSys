const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const { client: redisClient } = require('./config/redis');
const cron = require('node-cron');
const User = require('./models/User');

dotenv.config();

connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/credits', require('./routes/creditRoutes'));
app.use('/api/admin', require('./routes/analyticsRoutes'));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Running daily credit reset...');
    await User.updateMany({}, { 
      $set: { 
        credits: 20,
        lastCreditReset: new Date()
      } 
    });
    console.log('Credits reset successfully');
  } catch (error) {
    console.error('Error resetting credits:', error);
  }
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  
  // Close Redis connection
  redisClient.quit(() => {
    console.log('Redis connection closed');
  });
  
  // Close MongoDB connection
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
  
  // Force exit after 5 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
}); 