const express = require('express');
const router = express.Router();
const { 
  requestCredits, 
  getUserCreditRequests, 
  getAllCreditRequests, 
  updateCreditRequest 
} = require('../controllers/creditController');
const { auth, isAdmin } = require('../middleware/auth');

router.post('/request', auth, requestCredits);
router.get('/requests', auth, getUserCreditRequests);
router.get('/admin/requests', auth, isAdmin, getAllCreditRequests);
router.put('/admin/requests/:id', auth, isAdmin, updateCreditRequest);

module.exports = router; 