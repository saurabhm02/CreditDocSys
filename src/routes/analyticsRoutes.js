const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/analytics', auth, isAdmin, getAnalytics);

module.exports = router; 