const logger = require('../utils/logger');
const analyticsService = require('../services/analyticsService');


const getAnalytics = async (req, res) => {
  try {
    await analyticsService.getAnalytics(req, res);
  } catch (error) {
    logger.error(`Error in getAnalytics: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAnalytics }; 