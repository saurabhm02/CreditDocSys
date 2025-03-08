const jwt = require('jsonwebtoken');
require("dotenv").config();
const { User } = require('../models/index');
const logger = require('../utils/logger');
const jwt_secret = process.env.JWT_SECRET;

exports.auth = async (req, res, next) => {
    try {      
        logger.info(`Authenticating request`);
        
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
            logger.debug(`Token extracted from Authorization header: ${token.substring(0, 20)}...`);
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
            logger.debug('Token extracted from cookies');
        } else if (req.body && req.body.token) {
            token = req.body.token;
            logger.debug('Token extracted from request body');
        }
        
        // Check if token exists
        if (!token) {
            logger.warn('Authentication failed: Token is missing');
            return res.status(401).json({
                success: false,
                message: "Token is missing"
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (!user) {
                logger.warn(`Authentication failed: User not found with ID ${decoded.id}`);
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }
            req.user = {
                id: decoded.id,
                _id: user._id, 
                email: decoded.email,
                role: user.role 
            };
            
            logger.debug(`User object set in request: ${JSON.stringify(req.user)}`);
            
            next();
        } catch (err) {
            logger.warn(`Authentication failed: Invalid token - ${err.message}`);
            return res.status(401).json({
                success: false,
                message: "Token is invalid"
            });
        }
    } catch (error) {
        logger.error(`Authentication error: ${error.message}`);
        return res.status(401).json({
            success: false,
            message: "Authentication failed"
        });
    }
};


exports.isAdmin = async (req, res, next) => {
  try {
    logger.info(`Checking if user ${req.user.email} is an admin`);
    
    if (!req.user) {
      logger.warn('Admin check failed: No user in request');
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }
    
    logger.info(`User role: ${req.user.role}`);
    
    if (req.user.role !== 'admin') {
      logger.warn(`Authorization failed: User ${req.user.email} is not an admin`);
      return res.status(403).json({
        success: false,
        message: "You are not authorized as an admin to access this route"
      });
    }
    
    logger.debug(`User ${req.user.email} authorized as admin`);
    next();
  } catch (error) {
    logger.error(`Admin authorization error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Some error occurred while authenticating the admin"
    });
  }
};

exports.protect = exports.auth;
exports.admin = exports.isAdmin; 