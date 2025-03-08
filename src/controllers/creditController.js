const logger = require('../utils/logger');
const creditService = require('../services/creditService');


const requestCredits = async (req, res) => {
  try {
    await creditService.requestCredits(req, res);
  } catch (error) {
    logger.error(`Error in requestCredits: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserCreditRequests = async (req, res) => {
  try {
    await creditService.getUserCreditRequests(req, res);
  } catch (error) {
    logger.error(`Error in getUserCreditRequests: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};


const getAllCreditRequests = async (req, res) => {
  try {
    await creditService.getAllCreditRequests(req, res);
  } catch (error) {
    logger.error(`Error in getAllCreditRequests: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};


const updateCreditRequest = async (req, res) => {
  try {
    await creditService.updateCreditRequest(req, res);
  } catch (error) {
    logger.error(`Error in updateCreditRequest: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  requestCredits,
  getUserCreditRequests,
  getAllCreditRequests,
  updateCreditRequest,
}; 