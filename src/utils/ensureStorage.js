const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Create necessary storage directories
const ensureStorageDirectories = () => {
  const storageDir = path.join(__dirname, '../../storage');
  const uploadsDir = path.join(__dirname, '../../uploads');
  
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
    logger.info(`Created storage directory: ${storageDir}`);
  }
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    logger.info(`Created uploads directory: ${uploadsDir}`);
  }
};

module.exports = ensureStorageDirectories; 