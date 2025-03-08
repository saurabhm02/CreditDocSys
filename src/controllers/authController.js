
const userService = require('../services/userService');

const registerUser = async (req, res) => {
  try {
    await userService.registerUser(req, res);
  } catch (error) {
    logger.error(`Error in registerUser: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

const loginUser = async (req, res) => {
  try {
    await userService.loginUser(req, res);
  } catch (error) {
    logger.error(`Error in loginUser: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserProfile = async (req, res) => {
  try {
    await userService.getUserProfile(req, res);
  } catch (error) {
    logger.error(`Error in getUserProfile: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerUser, loginUser, getUserProfile }; 