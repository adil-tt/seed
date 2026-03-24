const express = require('express');
const router = express.Router();

// Import modular action from offer subfolder
const getActiveOffers = require('../controllers/offer/getActiveOffers');

// Public route for users to view active offers
router.get('/active', getActiveOffers);

module.exports = router;
