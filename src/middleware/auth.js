const jwt = require('jsonwebtoken');
const User = require('../models/User');

const jwt_secret = process.env.JWT_SECRET;

const protect = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer", "").trim();
        
        // Check if token is missing
        if (!token) {
          return res.status(401).json({
            success: false,
            message: "Token is missing",
          });
        }
    
        try {
          const decode = jwt.verify(token, jwt_secret);
          req.user = decode;
        } catch (err) {
          return res.status(401).send({
            success: false,
            message: "Token is invalid"
          });
        }
        next();
    } catch (error) {
        return res.status(401).send({
          success: false,
          message: "Some error occurred while authenticating."
        });
    }
};

const admin = (req, res, next) => {
  try {
    const userDetails = User.findOne({ email: req.user.email });

    if (userDetails.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "You are not authorized as a admin to access this route"
      });
    }
    next();
  } catch (error) {
    return res.status(401).send({
      success: false,
      message: "Some error occurred while authenticating the admin"
    });
  }
};

module.exports = { protect, admin }; 