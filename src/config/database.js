const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    logger.info('Connecting to MongoDB...');
    const uri = process.env.URL_MONGO;
    const conn = await mongoose.connect(uri);
    logger.info(`MongoDB Connected successfully`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 