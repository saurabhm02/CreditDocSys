const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Base directory for file storage
const storageDir = path.join(__dirname, '../../storage');

// Create storage directory if it doesn't exist
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
  logger.info(`Created storage directory: ${storageDir}`);
}

/**
 * Store content to a file
 * @param {string} key - Unique key for the content
 * @param {string} content - Content to store
 * @returns {Promise<boolean>} - Success status
 */
const storeContent = async (key, content) => {
  try {
    const filePath = path.join(storageDir, key.replace(/:/g, '_'));
    fs.writeFileSync(filePath, content, 'utf8');
    logger.debug(`Content stored in file: ${filePath}`);
    return true;
  } catch (error) {
    logger.error(`Error storing content to file: ${error.message}`);
    return false;
  }
};

/**
 * Retrieve content from a file
 * @param {string} key - Unique key for the content
 * @returns {Promise<string|null>} - Retrieved content or null
 */
const retrieveContent = async (key) => {
  try {
    const filePath = path.join(storageDir, key.replace(/:/g, '_'));
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      logger.debug(`Content retrieved from file: ${filePath}`);
      return content;
    }
    logger.warn(`File not found: ${filePath}`);
    return null;
  } catch (error) {
    logger.error(`Error retrieving content from file: ${error.message}`);
    return null;
  }
};

/**
 * Delete content file
 * @param {string} key - Unique key for the content
 * @returns {Promise<boolean>} - Success status
 */
const deleteContent = async (key) => {
  try {
    const filePath = path.join(storageDir, key.replace(/:/g, '_'));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.debug(`File deleted: ${filePath}`);
      return true;
    }
    logger.warn(`File not found for deletion: ${filePath}`);
    return false;
  } catch (error) {
    logger.error(`Error deleting file: ${error.message}`);
    return false;
  }
};

module.exports = {
  storeContent,
  retrieveContent,
  deleteContent
}; 