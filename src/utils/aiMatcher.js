const axios = require('axios');
const logger = require('./logger');

/**
 * Calculate basic similarity between two text documents
 * @param {string} text1 - First text document
 * @param {string} text2 - Second text document
 * @returns {number} - Similarity score between 0 and 1
 */
const calculateSimilarity = (text1, text2) => {
    try {
      if (!text1 || !text2) {
        logger.warn('Empty text provided for similarity calculation');
        return 0;
      }
  
      // Normalize texts
      const normalizedText1 = text1.toLowerCase().trim();
      const normalizedText2 = text2.toLowerCase().trim();
  
      // Split into words and create sets
      const words1 = new Set(normalizedText1.split(/\s+/).filter(word => word.length > 0));
      const words2 = new Set(normalizedText2.split(/\s+/).filter(word => word.length > 0));
  
      // Calculate Jaccard similarity
      const intersection = new Set([...words1].filter(word => words2.has(word)));
      const union = new Set([...words1, ...words2]);
  
      // Handle edge cases
      if (union.size === 0) return 0;
  
      const jaccardSimilarity = intersection.size / union.size;
      
      // Calculate additional metrics
      const lengthRatio = Math.min(normalizedText1.length, normalizedText2.length) / 
                          Math.max(normalizedText1.length, normalizedText2.length);
      
      // Combine metrics for final score
      const combinedScore = (jaccardSimilarity * 0.7) + (lengthRatio * 0.3);
      
      logger.debug(`Similarity calculation - Jaccard: ${jaccardSimilarity.toFixed(2)}, Length ratio: ${lengthRatio.toFixed(2)}, Combined: ${combinedScore.toFixed(2)}`);
      
      return combinedScore;
    } catch (error) {
      logger.error(`Error calculating similarity: ${error.message}`);
      return 0;
    }
};
const isAIMatchingEnabled = () => {
  return (
    process.env.HUGGINGFACE_API_TOKEN || 
    process.env.AI_MATCHING_ENABLED === 'true'
  );
};

/**
 * Calculate similarity using Hugging Face
 * @param {string} text1 - First text document
 * @param {string} text2 - Second text document
 * @returns {Promise<number>} - Similarity score between 0 and 1
 */
const calculateHuggingFaceSimilarity = async (text1, text2) => {
  const apiToken = process.env.HUGGINGFACE_API_TOKEN;
  if (!apiToken) {
    throw new Error('Hugging Face API token not configured');
  }

  const MAX_LENGTH = 1000;
  const truncatedText1 = text1.length > MAX_LENGTH ? text1.substring(0, MAX_LENGTH) + '...' : text1;
  const truncatedText2 = text2.length > MAX_LENGTH ? text2.substring(0, MAX_LENGTH) + '...' : text2;

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
      {
        inputs: {
          source_sentence: truncatedText1,
          sentences: [truncatedText2]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    logger.info(`Hugging Face API response: ${JSON.stringify(response.data)}`);

    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      const score = response.data[0];
      return score;
    } else {
      throw new Error('Invalid response from Hugging Face API');
    }
  } catch (error) {
    if (error.response) {
      logger.error(`Hugging Face API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // The request was made but no response was received
      logger.error(`Hugging Face API no response: ${error.message}`);
    } else {
      // Something happened in setting up the request that triggered an Error
      logger.error(`Hugging Face API request error: ${error.message}`);
    }
    throw error;
  }
};

module.exports = {
  calculateSimilarity,
  calculateHuggingFaceSimilarity,
  isAIMatchingEnabled
};