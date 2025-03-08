const mongoose = require('mongoose');
const fs = require('fs');
const logger = require('../utils/logger');
const { calculateSimilarity, calculateHuggingFaceSimilarity } = require('../utils/aiMatcher');
const { User, Document, ScanHistory } = require('../models/index');
const storage = require('../utils/storage');

const scanDocument = async (req, res) => {
  try {
    logger.info(`Document scan initiated by user: ${req.user.id}`);
    
    if (!req.file) {
      logger.warn('Document scan failed: No file uploaded');
      return res.status(400).json({ 
        success: false,
        message: 'Please upload a file' 
      });
    }
    const filePath = req.file.path;
    let content;
    
    try {
      content = fs.readFileSync(filePath, 'utf8');
      logger.info(`File read from path: ${filePath}`);
    } catch (error) {
      logger.error(`Error reading file: ${error.message}`);
      return res.status(500).json({ 
        success: false,
        message: 'Error reading uploaded file' 
      });
    }

    const contentKey = `document:${req.user.id}:${Date.now()}`;

    const storageResult = await storage.storeContent(contentKey, content);
    
    const document = await Document.create({
      title: req.file.originalname,
      content: content.substring(0, 1000), 
      user: req.user.id,
      filePath: storageResult.success ? contentKey : filePath, 
    });
    logger.info(`Document created in database with ID: ${document._id}`);

    if (storageResult.success) {
      storage.cleanupTempFile(filePath);
    }

    const allDocuments = await Document.find({ _id: { $ne: document._id } });
    logger.debug(`Found ${allDocuments.length} documents to compare against`);
    
    const matchResults = [];
    const useAI = req.query.useAI === 'true' || req.body.useAI === true;
    logger.info(`AI matching ${useAI ? 'enabled' : 'disabled'} for this scan`);
    
    for (const doc of allDocuments) {
      let docContent = doc.content;
      if (doc.filePath) {
        if (doc.filePath.startsWith('document:')) {
          const redisContent = await storage.retrieveContent(doc.filePath);
          if (redisContent) {
            docContent = redisContent;
            logger.debug(`Retrieved full content from storage for document: ${doc._id}`);
          }
        } else {
          try {
            docContent = fs.readFileSync(doc.filePath, 'utf8');
            logger.debug(`Retrieved full content from filesystem for document: ${doc._id}`);
          } catch (error) {
            logger.error(`Error reading document from filesystem: ${error.message}`);
          }
        }
      }
      
      let similarityScore;
      
      if (useAI) {
        try {
          similarityScore = await calculateHuggingFaceSimilarity(content, docContent);
          logger.debug(`AI similarity score for document ${doc._id}: ${similarityScore}`);
        } catch (error) {
          logger.error(`AI similarity calculation failed: ${error.message}`);
          similarityScore = calculateSimilarity(content, docContent);
          logger.debug(`Fallback to basic similarity score: ${similarityScore}`);
        }
      } else {
        similarityScore = calculateSimilarity(content, docContent);
        logger.debug(`Basic similarity score for document ${doc._id}: ${similarityScore}`);
      }
      
      const threshold = useAI ? 0.2 : 0.3;
      
      if (similarityScore > threshold) {
        matchResults.push({
          document: doc._id,
          similarityScore,
        });
        logger.debug(`Document ${doc._id} matched with score: ${similarityScore}`);
      }
    }
    matchResults.sort((a, b) => b.similarityScore - a.similarityScore);
    logger.info(`Found ${matchResults.length} matching documents`);
    
    // Create scan history
    const scanHistory = await ScanHistory.create({
      user: req.user.id,
      document: document._id,
      matchResults,
      usedAI: useAI
    });
    logger.info(`Scan history created with ID: ${scanHistory._id}`);

    // Deduct 1 credit from user
    const user = await User.findById(req.user.id);
    user.credits -= 1;
    await user.save();
    logger.info(`Deducted 1 credit from user ${req.user.id}, remaining: ${user.credits}`);

    res.status(201).json({
      success: true,
      document,
      matchResults: matchResults.slice(0, 10), 
      remainingCredits: user.credits,
      usedAI: useAI
    });
    logger.info(`Document scan completed successfully`);
  } catch (error) {
    logger.error(`Error during document scan: ${error.message}`);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

const getDocumentContent = async (req, res) => {
  try {
    logger.info(`Fetching content for document ID: ${req.params.id}`);
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!document) {
      logger.warn(`Document not found: ${req.params.id}`);
      return res.status(404).json({ message: 'Document not found' });
    }

    // If document content is stored in Redis
    if (document.filePath && document.filePath.startsWith('document:')) {
      try {
        const content = await storage.retrieveContent(document.filePath);
        if (content) {
          logger.info(`Retrieved document content from Redis: ${document.filePath}`);
          return res.json({ content });
        }
      } catch (error) {
        logger.error(`Error retrieving document from Redis: ${error.message}`);
      }
    }

    // Fallback to the content stored in db
    logger.info(`Falling back to MongoDB content for document: ${req.params.id}`);
    res.json({ content: document.content });
  } catch (error) {
    logger.error(`Error fetching document content: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

const getDocumentMatches = async (req, res) => {
  try {
    const { documentId } = req.params;
    logger.info(`Fetching matches for document ID: ${documentId}`);

    if (!documentId) {
      logger.error('Document ID is required');
      return res.status(400).json({ message: 'Document ID is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      logger.error(`Invalid document ID format: ${documentId}`);
      return res.status(400).json({ message: 'Invalid document ID format' });
    }
    const document = await Document.findById(documentId);
    if (!document) {
      logger.error(`Document not found with ID: ${documentId}`);
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.user.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn(`User ${req.user.id} attempted to access document ${documentId} without permission`);
      return res.status(403).json({ message: 'You do not have permission to access this document' });
    }

    let documentContent;
    
    if (document.filePath && document.filePath.startsWith('document:')) {
      documentContent = await storage.retrieveContent(document.filePath);
      
      if (!documentContent) {
        logger.warn(`Could not retrieve document content from storage for key: ${document.filePath}`);
        documentContent = document.content;
        logger.info('Using document preview from MongoDB as fallback');
      }
    } else if (document.filePath) {
      try {
        documentContent = fs.readFileSync(document.filePath, 'utf8');
      } catch (error) {
        logger.error(`Error reading document file: ${error.message}`);
        documentContent = document.content;
      }
    } else {
      documentContent = document.content;
    }

    const userDocuments = await Document.find({ 
      user: req.user.id,
      _id: { $ne: documentId } 
    });
    
    logger.info(`Found ${userDocuments.length} other documents to compare against`);

    const matches = [];
    for (const doc of userDocuments) {
      let comparisonContent;
      
      if (doc.filePath && doc.filePath.startsWith('document:')) {
        comparisonContent = await storage.retrieveContent(doc.filePath);
        if (!comparisonContent) {
          comparisonContent = doc.content;
        }
      } else if (doc.filePath) {
        try {
          comparisonContent = fs.readFileSync(doc.filePath, 'utf8');
        } catch (error) {
          comparisonContent = doc.content;
        }
      } else {
        comparisonContent = doc.content;
      }

      let similarityScore;
      try {
        similarityScore = await calculateHuggingFaceSimilarity(documentContent, comparisonContent);
      } catch (error) {
        similarityScore = calculateSimilarity(documentContent, comparisonContent);
      }

      const SIMILARITY_THRESHOLD = 0.3;
      if (similarityScore >= SIMILARITY_THRESHOLD) {
        matches.push({
          document: {
            id: doc._id,
            title: doc.title,
            createdAt: doc.createdAt
          },
          similarityScore
        });
      }
    }

    matches.sort((a, b) => b.similarityScore - a.similarityScore);

    logger.info(`Retrieved ${matches.length} matches for document: ${documentId}`);
    return res.status(200).json(matches);
  } catch (error) {
    logger.error(`Error getting document matches: ${error.message}`);
    return res.status(500).json({ message: 'Error getting document matches' });
  }
};

const getUserScanHistory = async (req, res) => {
  try {
    logger.info(`Fetching scan history for user: ${req.user._id}`);
    const scanHistory = await ScanHistory.find({ user: req.user._id })
      .populate('document', 'title createdAt')
      .sort({ createdAt: -1 });

    logger.info(`Retrieved ${scanHistory.length} scan history entries for user: ${req.user._id}`);
    res.json(scanHistory);
  } catch (error) {
    logger.error(`Error fetching user scan history: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const { documentId } = req.params;
    logger.info(`Fetching document with ID: ${documentId}`);

    const document = await Document.findById(documentId);
    if (!document) {
      logger.error(`Document not found with ID: ${documentId}`);
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.user.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn(`User ${req.user.id} attempted to access document ${documentId} without permission`);
      return res.status(403).json({ message: 'You do not have permission to access this document' });
    }

    let content = document.content;
    
    if (req.query.fullContent === 'true') {
      if (document.filePath && document.filePath.startsWith('document:')) {
        const fullContent = await storage.retrieveContent(document.filePath);
        if (fullContent) {
          content = fullContent;
        }
      } else if (document.filePath) {
        try {
          content = fs.readFileSync(document.filePath, 'utf8');
        } catch (error) {
          logger.error(`Error reading document file: ${error.message}`);
        }
      }
    }

    logger.info(`Document retrieved successfully: ${documentId}`);
    return res.status(200).json({
      id: document._id,
      title: document.title,
      content: content,
      createdAt: document.createdAt,
      user: document.user
    });
  } catch (error) {
    logger.error(`Error getting document: ${error.message}`);
    return res.status(500).json({ message: 'Error getting document' });
  }
};

const getDocumentHistory = async (req, res) => {
  try {
    logger.info('Fetching document scan history');
    
    const history = await ScanHistory.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('document', 'title createdAt')
      .limit(50); 
    
    logger.info(`Retrieved ${history.length} scan history entries for user: ${req.user.id}`);
    
    return res.status(200).json(history.map(entry => ({
      id: entry._id,
      document: entry.document ? {
        id: entry.document._id,
        title: entry.document.title,
        createdAt: entry.document.createdAt
      } : null,
      scanType: entry.scanType,
      createdAt: entry.createdAt
    })));
  } catch (error) {
    logger.error(`Error getting document history: ${error.message}`);
    return res.status(500).json({ message: 'Error getting document history' });
  }
};

module.exports = {
  scanDocument,
  getDocumentContent,
  getDocumentMatches,
  getUserScanHistory,
  retrieveDocumentContent: storage.retrieveContent,
  getDocumentById,
  getDocumentHistory
}; 