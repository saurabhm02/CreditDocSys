const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models/index');
const logger = require('../utils/logger');

const registerUser = async (req, res) => {
    try {
      logger.info(`Attempting to register user with email: ${req.body.email}`);
      const { username, email, password } = req.body;
  
      if (!username || !email || !password ) {
          logger.warn(`Registration failed: Missing required fields`);
          return res.status(403).json({
            success: false,
            message: "All fields are required."
          });
        }
  
      // Check if user exists
      const userExists = await User.findOne({ $or: [{ email }, { username }] });
      if (userExists) {
          logger.warn(`Registration failed: User with email ${email} or username ${username} already exists`);
          return res.status(400).json({
            success: false,
            message: "This email is already registered.",
          });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      // Create user entry in DB
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
      });
  
      logger.info(`User registered successfully: ${email}`);
      res.status(200).json({
          success: true,
          message: "User registered successfully.",
          user,
      });
    } catch (error) {
      logger.error(`Error registering user: ${error.message}`);
      res.status(500).json({
        success: false,
        message: "User cannot be registered! Please try again.",
      });
    }
};

const loginUser = async (req, res) => {
    try {
      logger.info(`Login attempt for user: ${req.body.email}`);
      const { email, password } = req.body;
      if (!email || !password) {
          logger.warn(`Login failed: Missing required fields`);
          return res.status(404).json({
            success: false,
            message: "All required fields must be provided.",
          });
      }
  
      // Check for user email
      const user = await User.findOne({ email });
      if (!user) {
        logger.warn(`Login failed: User with email ${email} not found`);
        return res.status(401).json({
          success: false,
          message: "User not found.",
        });
      }
  
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        // Make sure to include the correct role from the database
        const token = jwt.sign(
          { 
            email: user.email, 
            id: user._id.toString(),
            role: user.role // Use the role from the database
          },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );
    
        // Log the token payload for debugging
        const payload = { email: user.email, id: user._id.toString(), role: user.role };
        logger.debug(`Token payload: ${JSON.stringify(payload)}`);
    
        user.password = undefined; 
        logger.info(`User logged in successfully: ${email}`);
        res.status(200).json({
          success: true,
          message: "Logged in successfully.",
          token,
          user,
        });
      } else {
        logger.warn(`Login failed: Incorrect password for user ${email}`);
        return res.status(401).json({
          success: false,
          message: "Password is incorrect!",
        });
      }
    } catch (error) {
      logger.error(`Error during login: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "User cannot login! Please try again.",
      });
    }
};
  
const getUserProfile = async (req, res) => {
  try {
    // Log the user object for debugging
    logger.debug(`User object in request: ${JSON.stringify(req.user)}`);
    
    // Get the user ID - try different properties
    const userId = req.user._id || req.user.id;
    
    logger.info(`Fetching profile for user ID: ${userId}`);
    
    // Make sure we have a user ID
    if (!userId) {
      logger.warn('Profile fetch failed: No user ID in request');
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }
    
    const user = await User.findById(userId);
  
    if (user) {
      logger.info(`Profile fetched successfully for user ID: ${userId}`);
      res.json({
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          credits: user.credits,
          lastCreditReset: user.lastCreditReset,
        }
      });
    } else {
      logger.warn(`Profile fetch failed: User ID ${userId} not found`);
      res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
  } catch (error) {
    logger.error(`Error fetching user profile: ${error.message}`);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
};



