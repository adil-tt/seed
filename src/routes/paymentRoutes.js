const express = require("express");
const router = express.Router();
const  protect  = require("../middleware/authMiddleware");
const userOnly = require("../middleware/userMiddleware");

// Import modular actions from payment subfolder
const createRazorpayOrder = require("../controllers/payment/createRazorpayOrder");
const verifyRazorpayPayment = require("../controllers/payment/verifyRazorpayPayment");
const createWalletFundOrder = require("../controllers/payment/createWalletFundOrder");
const verifyWalletFundPayment = require("../controllers/payment/verifyWalletFundPayment");

router.post("/create-order", protect, userOnly, createRazorpayOrder);
router.post("/verify-payment", protect, userOnly, verifyRazorpayPayment);

// Wallet fund routes
router.post("/wallet/create-order", protect, userOnly, createWalletFundOrder);
router.post("/wallet/verify", protect, userOnly, verifyWalletFundPayment);

module.exports = router;