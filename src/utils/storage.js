const fs = require('fs');
const path = require('path');
const redisClient = require('../config/redis');
const logger = require('./logger');

// Base directories
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const STORAGE_DIR = path.join(__dirname, '../../storage');

const ensureDirectories = () => {
  [UPLOADS_DIR, STORAGE_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  });
};
ensureDirectories();

/**
 * Retrieve document content from storage
 * @param {string} key - Storage key for the document
 * @returns {Promise<string|null>} - Document content or null if not found
 */
const retrieveContent = async (key) => {
  try {
    // Try Redis first, we use fallback to file storage
    if (redisClient && redisClient.getAsync) {
      try {
        const content = await redisClient.getAsync(key);
        if (content) {
          logger.debug(`Content retrieved from Redis with key: ${key}`);
          return content;
        }
      } catch (redisError) {
        logger.error(`Redis retrieval error: ${redisError.message}`);
      }
    }
    
    // If Redis fails or content not found, try file storage
    try {
      const filePath = path.join(STORAGE_DIR, key.replace(/:/g, '_'));
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        logger.debug(`Content retrieved from file: ${filePath}`);
        return content;
      }
    } catch (fileError) {
      logger.error(`Error reading from file storage: ${fileError.message}`);
    }
    
    return null;
  } catch (error) {
    logger.error(`Error retrieving content: ${error.message}`);
    return null;
  }
};

/**
 * Store document content
 * @param {string} key - Storage key for the document
 * @param {string} content - Document content to store
 * @returns {Promise<{success: boolean, storage: string}>} - Result of storage operation
 */
const storeContent = async (key, content) => {
  try {
    // Try Redis first
    let storedInRedis = false;
    if (redisClient && redisClient.setAsync) {
      try {
        const result = await redisClient.setAsync(key, content);
        storedInRedis = (result === 'OK');
        if (storedInRedis) {
          logger.debug(`Content stored in Redis with key: ${key}`);
        }
      } catch (redisError) {
        logger.error(`Redis storage error: ${redisError.message}`);
      }
    }
    
    // If Redis fails, use file storage as backup
    if (!storedInRedis) {
      try {
        const filePath = path.join(STORAGE_DIR, key.replace(/:/g, '_'));
        fs.writeFileSync(filePath, content, 'utf8');
        logger.debug(`Content stored in file: ${filePath}`);
        return { success: true, storage: 'file' };
      } catch (fileError) {
        logger.error(`File storage error: ${fileError.message}`);
        return { success: false };
      }
    }
    
    return { success: storedInRedis, storage: 'redis' };
  } catch (error) {
    logger.error(`Error storing content: ${error.message}`);
    return { success: false };
  }
};

/**
 * Delete document content
 * @param {string} key - Storage key for the document
 * @returns {Promise<boolean>} - Success status
 */
const deleteContent = async (key) => {
  try {
    let deleted = false;

    if (redisClient && redisClient.delAsync) {
      try {
        const result = await redisClient.delAsync(key);
        deleted = (result > 0);
      } catch (redisError) {
        logger.error(`Redis deletion error: ${redisError.message}`);
      }
    }
    
    try {
      const filePath = path.join(STORAGE_DIR, key.replace(/:/g, '_'));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deleted = true;
      }
    } catch (fileError) {
      logger.error(`File deletion error: ${fileError.message}`);
    }
    
    return deleted;
  } catch (error) {
    logger.error(`Error deleting content: ${error.message}`);
    return false;
  }
};

/**
 * Get upload directory path
 * @returns {string} - Path to uploads directory
 */
const getUploadsDir = () => UPLOADS_DIR;

/**
 * Clean up temporary files
 * @param {string} filePath - Path to file to clean up
 */
const cleanupTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.debug(`Temporary file removed: ${filePath}`);
    }
  } catch (error) {
    logger.error(`Error removing temporary file: ${error.message}`);
  }
};

module.exports = {
  retrieveContent,
  storeContent,
  deleteContent,
  getUploadsDir,
  cleanupTempFile
}; 