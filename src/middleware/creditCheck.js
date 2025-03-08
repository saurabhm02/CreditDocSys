const { User } = require('../models/index');
const moment = require('moment');
const logger = require('../utils/logger');

const checkAndResetCredits = async (req, res, next) => {
  try {
    logger.info(`Checking credits for user: ${req.user.id}`);
    const user = await User.findById(req.user.id);
    
    // Check if it's a new day since last reset
    const lastReset = moment(user.lastCreditReset);
    const now = moment();
    
    if (now.diff(lastReset, 'days') >= 1) {
      logger.info(`Resetting credits for user ${req.user.id} - new day detected`);
      user.credits = process.env.DAILY_FREE_CREDITS || 20;
      user.lastCreditReset = now;
      await user.save();
      logger.info(`Credits reset to ${user.credits} for user ${req.user.id}`);
    }
    
    next();
  } catch (error) {
    logger.error(`Error during credit check: ${error.message}`);
    res.status(500).json({ message: 'Server error during credit check' });
  }
};

const hasSufficientCredits = async (req, res, next) => {
  try {
    logger.info(`Verifying sufficient credits for user: ${req.user.id}`);
    const user = await User.findById(req.user.id);
    
    if (user.credits <= 0) {
      logger.warn(`Insufficient credits for user ${req.user.id}, current credits: ${user.credits}`);
      return res.status(403).json({ 
        success: false,
        message: 'Insufficient credits. Please request more credits or wait until tomorrow.'
      });
    }
    
    logger.info(`User ${req.user.id} has sufficient credits: ${user.credits}`);
    next();
  } catch (error) {
    logger.error(`Error during credit verification: ${error.message}`);
    res.status(500).json({ message: 'Server error during credit verification' });
  }
};

module.exports = { checkAndResetCredits, hasSufficientCredits };