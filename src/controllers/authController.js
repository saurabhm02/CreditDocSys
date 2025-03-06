const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password ) {
        return res.status(403).json({
          success: false,
          message: "All fields are required."
        });
      }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
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

    res.status(200).json({
        success: true,
        message: "User registered successfully.",
        user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "User cannot be registered! Please try again.",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(404).json({
          success: false,
          message: "All required fields must be provided.",
        });
    }

    // Check for user email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign(
          { email: user.email, id: user._id, role: user.role },
          jwt_Secret,
          { expiresIn: "24h" }
        );
  
        user.password = undefined; 
        res.status(200).json({
          success: true,
          message: "Logged in successfully.",
          token,
          user,
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Password is incorrect!",
        });
      }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "User cannot login! Please try again.",
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        credits: user.credits,
        lastCreditReset: user.lastCreditReset,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerUser, loginUser, getUserProfile }; 