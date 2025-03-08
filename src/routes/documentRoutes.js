const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { checkAndResetCredits, hasSufficientCredits } = require('../middleware/creditCheck');
const multer = require('multer');
const path = require('path');
const logger = require('../utils/logger');
const { Document } = require('../models/index');
const fs = require('fs');
const documentService = require('../services/documentService');
const storage = require('../utils/storage');
const mongoose = require('mongoose');

const upload = multer({
  dest: storage.getUploadsDir(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['text/plain'];
    const allowedExtensions = ['.txt', '.text', '.md', '.csv'];
    
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      logger.warn(`Rejected file upload: ${file.originalname} (${file.mimetype})`);
      cb(new Error('Only text files are allowed'));
    }
  }
});

router.get('/', auth, async (req, res) => {
  try {
    logger.info('List documents request received');
    
    const documents = await Document.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('_id title createdAt');
    
    logger.info(`Retrieved ${documents.length} documents for user: ${req.user.id}`);
    
    return res.status(200).json(documents);
  } catch (error) {
    logger.error(`Error listing documents: ${error.message}`);
    return res.status(500).json({ message: 'Error listing documents' });
  }
});
router.get('/history', auth, async (req, res) => {
  try {
    logger.info('Document history request received');
    
    if (!documentService.getDocumentHistory) {
      logger.error('getDocumentHistory function is not defined in document service');
      return res.status(500).json({ message: 'Internal server error' });
    }
    
    return await documentService.getDocumentHistory(req, res);
  } catch (error) {
    logger.error(`Error in document history route: ${error.message}`);
    return res.status(500).json({ message: 'Error processing document history request' });
  }
});

router.post('/scan', auth, checkAndResetCredits, hasSufficientCredits, upload.single('document'), documentService.scanDocument);


router.get('/matches/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    logger.info(`Get document matches request received for document ID: ${documentId}`);
    
    if (!documentId) {
      logger.error('Document ID is missing in request parameters');
      return res.status(400).json({ message: 'Document ID is required' });
    }
    
    if (!documentService.getDocumentMatches) {
      logger.error('getDocumentMatches function is not defined in document service');
      return res.status(500).json({ message: 'Internal server error' });
    }
    
    return await documentService.getDocumentMatches(req, res);
  } catch (error) {
    logger.error(`Error in document matches route: ${error.message}`);
    return res.status(500).json({ message: 'Error processing document matches request' });
  }
});

router.get('/test-content/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    logger.info(`Testing content retrieval for document ID: ${documentId}`);

    const document = await Document.findById(documentId);
    if (!document) {
      logger.error(`Document not found with ID: ${documentId}`);
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.user.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn(`User ${req.user.id} attempted to access document ${documentId} without permission`);
      return res.status(403).json({ message: 'You do not have permission to access this document' });
    }
    let content = null;
    let source = 'unknown';
    
    if (document.filePath && document.filePath.startsWith('document:')) {
      content = await storage.retrieveContent(document.filePath);
      source = content ? 'storage' : 'not found';
    } else if (document.filePath) {
      // Try to read from filesystem
      try {
        content = fs.readFileSync(document.filePath, 'utf8');
        source = 'filesystem';
      } catch (error) {
        logger.error(`Error reading document file: ${error.message}`);
      }
    }
    
    if (!content) {
      content = document.content;
      source = 'mongodb';
    }

    return res.status(200).json({
      document: {
        id: document._id,
        title: document.title,
        filePath: document.filePath,
        createdAt: document.createdAt
      },
      contentSource: source,
      contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      contentLength: content.length
    });
  } catch (error) {
    logger.error(`Error testing document content: ${error.message}`);
    return res.status(500).json({ message: 'Error testing document content', error: error.message });
  }
});


router.get('/check/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    logger.info(`Checking document existence for ID: ${documentId}`);
    
    if (!documentId) {
      return res.status(400).json({ message: 'Document ID is required' });
    }
    
    // Check if document ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ message: 'Invalid document ID format' });
    }
    
    // Find the document
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    return res.status(200).json({
      message: 'Document exists',
      document: {
        id: document._id,
        title: document.title,
        user: document.user,
        filePath: document.filePath,
        createdAt: document.createdAt
      }
    });
  } catch (error) {
    logger.error(`Error checking document existence: ${error.message}`);
    return res.status(500).json({ message: 'Error checking document existence' });
  }
});

router.get('/:documentId', auth, async (req, res) => {
  try {
    logger.info(`Get document by ID request received for document ID: ${req.params.documentId}`);
    
    // Make sure this function is defined
    if (!documentService.getDocumentById) {
      logger.error('getDocumentById function is not defined in document service');
      return res.status(500).json({ message: 'Internal server error' });
    }
    
    return await documentService.getDocumentById(req, res);
  } catch (error) {
    logger.error(`Error in get document by ID route: ${error.message}`);
    return res.status(500).json({ message: 'Error processing get document by ID request' });
  }
});

router.get('/:documentId/content', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    logger.info(`Fetching content for document ID: ${documentId}`);

    // Find the document
    const document = await Document.findById(documentId);
    if (!document) {
      logger.error(`Document not found with ID: ${documentId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    // Check if user has access to this document
    if (document.user.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn(`User ${req.user.id} attempted to access document ${documentId} without permission`);
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to access this document' 
      });
    }

    // Retrieve full document content
    let content;
    
    if (document.filePath && document.filePath.startsWith('document:')) {
      // Try to retrieve from storage
      content = await storage.retrieveContent(document.filePath);
      
      if (!content) {
        logger.warn(`Could not retrieve document content from storage for key: ${document.filePath}`);
        // Fall back to the preview stored in MongoDB
        content = document.content;
        logger.info('Using document preview from MongoDB as fallback');
      }
    } else if (document.filePath) {
      // Try to read from filesystem
      try {
        content = fs.readFileSync(document.filePath, 'utf8');
      } catch (error) {
        logger.error(`Error reading document file: ${error.message}`);
        // Fall back to the preview stored in MongoDB
        content = document.content;
      }
    } else {
      // Use the content stored in MongoDB
      content = document.content;
    }

    logger.info(`Document content retrieved successfully: ${documentId}`);
    return res.status(200).json({
      success: true,
      document: {
        id: document._id,
        title: document.title,
        content: content,
        createdAt: document.createdAt
      }
    });
  } catch (error) {
    logger.error(`Error getting document content: ${error.message}`);
    return res.status(500).json({ 
      success: false, 
      message: 'Something went wrong!' 
    });
  }
});

module.exports = router; 