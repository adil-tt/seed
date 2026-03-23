const express = require('express');
const router = express.Router();
const { getActiveOffers } = require('../controllers/offerController');

// @desc    Get all active offers for home page
// @route   GET /api/offers/active
// @access  Public
router.get('/active', getActiveOffers);

module.exports = router;
