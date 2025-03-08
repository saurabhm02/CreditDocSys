const { User } = require('../models/index');
const logger = require('../utils/logger');
const { CreditRequest } = require('../models/index'); 

const requestCredits = async (req, res) => {
  try {
    logger.info(`User object in request: ${JSON.stringify(req.user)}`);
    const userId = req.user._id || req.user.id;
    
    logger.info(`Credit request initiated by user: ${userId}`);
    const { amount, reason } = req.body;

    if (!amount || amount < 1) {
      logger.warn(`Invalid credit request: Amount must be at least 1`);
      return res.status(400).json({ message: 'Please provide a valid amount' });
    }

    if (!userId) {
      logger.error('Credit request failed: No user ID available');
      return res.status(401).json({ message: 'User not authenticated properly' });
    }

    const creditRequest = await CreditRequest.create({
      user: userId,
      amount,
      reason,
    });
    logger.info(`Credit request created with ID: ${creditRequest._id}, amount: ${amount}`);

    res.status(201).json(creditRequest);
  } catch (error) {
    logger.error(`Error creating credit request: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserCreditRequests = async (req, res) => {
  try {
    logger.info(`Fetching credit requests for user: ${req.user._id}`);
    const creditRequests = await CreditRequest.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    logger.info(`Retrieved ${creditRequests.length} credit requests for user: ${req.user._id}`);
    res.json(creditRequests);
  } catch (error) {
    logger.error(`Error fetching user credit requests: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllCreditRequests = async (req, res) => {
  try {
    logger.info(`Admin fetching all credit requests`);
    const creditRequests = await CreditRequest.find({})
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    logger.info(`Retrieved ${creditRequests.length} total credit requests`);
    res.json(creditRequests);
  } catch (error) {
    logger.error(`Error fetching all credit requests: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCreditRequest = async (req, res) => {
  try {
    logger.info(`Updating credit request ID: ${req.params.id}`);
    const { status, adminResponse } = req.body;

    const creditRequest = await CreditRequest.findById(req.params.id);

    if (!creditRequest) {
      logger.warn(`Credit request not found: ${req.params.id}`);
      return res.status(404).json({ message: 'Credit request not found' });
    }

    creditRequest.status = status;
    creditRequest.adminResponse = adminResponse;
    logger.info(`Credit request ${req.params.id} status updated to: ${status}`);

    // If approved, add credits to user
    if (status === 'approved') {
      const user = await User.findById(creditRequest.user);
      user.credits += creditRequest.amount;
      await user.save();
      logger.info(`Added ${creditRequest.amount} credits to user ${creditRequest.user}, new total: ${user.credits}`);
    }

    await creditRequest.save();

    res.json(creditRequest);
  } catch (error) {
    logger.error(`Error updating credit request: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  requestCredits,
  getUserCreditRequests,
  getAllCreditRequests,
  updateCreditRequest
}; 