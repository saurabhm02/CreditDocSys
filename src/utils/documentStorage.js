const fs = require('fs');
const path = require('path');
const redisClient = require('../config/redis');
const logger = require('./logger');

const storageDir = path.join(__dirname, '../../storage');

if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
  logger.info(`Created storage directory: ${storageDir}`);
}

/**
 * Retrieve document content from storage
 * @param {string} key - Storage key for the document
 * @returns {Promise<string|null>} - Document content or null if not found
 */
const retrieveDocumentContent = async (key) => {
  try {
    if (redisClient && redisClient.getAsync) {
      try {
        const content = await redisClient.getAsync(key);
        if (content) {
          logger.debug(`Document content retrieved from Redis with key: ${key}`);
          return content;
        }
      } catch (redisError) {
        logger.error(`Redis retrieval error: ${redisError.message}`);
      }
    }
    
    // If Redis fails or content not found, try file storage
    try {
      const filePath = path.join(storageDir, key.replace(/:/g, '_'));
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        logger.debug(`Document content retrieved from file: ${filePath}`);
        return content;
      }
    } catch (fileError) {
      logger.error(`Error reading from file storage: ${fileError.message}`);
    }
    
    logger.warn(`Document content not found for key: ${key}`);
    return null;
  } catch (error) {
    logger.error(`Error retrieving document content: ${error.message}`);
    return null;
  }
};

/**
 * Store document content
 * @param {string} key - Storage key for the document
 * @param {string} content - Document content to store
 * @returns {Promise<{success: boolean, storage: string}>} - Result of storage operation
 */
const storeDocumentContent = async (key, content) => {
  try {
    let storedInRedis = false;
    if (redisClient && redisClient.setAsync) {
      try {
        const result = await redisClient.setAsync(key, content);
        storedInRedis = (result === 'OK');
        if (storedInRedis) {
          logger.debug(`Document content stored in Redis with key: ${key}`);
        }
      } catch (redisError) {
        logger.error(`Redis storage error: ${redisError.message}`);
      }
    }
    
    if (!storedInRedis) {
      try {
        const filePath = path.join(storageDir, key.replace(/:/g, '_'));
        fs.writeFileSync(filePath, content, 'utf8');
        logger.debug(`Document content stored in file: ${filePath}`);
        return { success: true, storage: 'file' };
      } catch (fileError) {
        logger.error(`File storage error: ${fileError.message}`);
        return { success: false };
      }
    }
    
    return { success: storedInRedis, storage: 'redis' };
  } catch (error) {
    logger.error(`Error storing document content: ${error.message}`);
    return { success: false };
  }
};

/**
 * Delete document content
 * @param {string} key - Storage key for the document
 * @returns {Promise<boolean>} - Success status
 */
const deleteDocumentContent = async (key) => {
  try {
    let deleted = false;
    
    if (redisClient && redisClient.delAsync) {
      try {
        const result = await redisClient.delAsync(key);
        deleted = (result > 0);
        if (deleted) {
          logger.debug(`Document content deleted from Redis with key: ${key}`);
        }
      } catch (redisError) {
        logger.error(`Redis deletion error: ${redisError.message}`);
      }
    }
    
    // Also try to delete from file storage
    try {
      const filePath = path.join(storageDir, key.replace(/:/g, '_'));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.debug(`Document content deleted from file: ${filePath}`);
        deleted = true;
      }
    } catch (fileError) {
      logger.error(`File deletion error: ${fileError.message}`);
    }
    
    return deleted;
  } catch (error) {
    logger.error(`Error deleting document content: ${error.message}`);
    return false;
  }
};

module.exports = {
  retrieveDocumentContent,
  storeDocumentContent,
  deleteDocumentContent
}; 