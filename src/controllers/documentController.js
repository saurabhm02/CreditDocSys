const logger = require('../utils/logger');
const documentService = require('../services/documentService');


const scanDocument = async (req, res) => {
  try {
    await documentService.scanDocument(req, res);
  } catch (error) {
    logger.error(`Error in scanDocument: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};


const getDocumentContent = async (req, res) => {
  try {
    await documentService.getDocumentContent(req, res);
  } catch (error) {
    logger.error(`Error in getDocumentContent: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};


const getDocumentMatches = async (req, res) => {
  try {
    const { documentId } = req.params;
    logger.info(`Get document matches controller called for document ID: ${documentId}`);
    
    if (!documentId) {
      logger.error('Document ID is missing in request parameters');
      return res.status(400).json({ message: 'Document ID is required' });
    }
    
    return await documentService.getDocumentMatches(req, res);
  } catch (error) {
    logger.error(`Error in document matches controller: ${error.message}`);
    return res.status(500).json({ message: 'Error processing document matches request' });
  }
};


const getUserScanHistory = async (req, res) => {
  try {
    await documentService.getUserScanHistory(req, res);
  } catch (error) {
    logger.error(`Error in getUserScanHistory: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  scanDocument, 
  getDocumentContent,
  getDocumentMatches, 
  getUserScanHistory 
}; 

