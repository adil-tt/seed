const express = require('express');
const router = express.Router();
const { getAvailableCoupons } = require('../controllers/userCouponController');

// Public route for users to view available coupons
router.get('/available', getAvailableCoupons);

module.exports = router;
