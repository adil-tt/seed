const express = require('express');
const router = express.Router();

// Import modular action from coupon subfolder
const getAvailableCoupons = require('../controllers/coupon/getAvailableCoupons');

// Public route for users to view available coupons
router.get('/available', getAvailableCoupons);

module.exports = router;
