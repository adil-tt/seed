const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { 
  createRazorpayOrder, 
  verifyRazorpayPayment,
  createWalletFundOrder,
  verifyWalletFundPayment
} = require("../controllers/paymentController");

router.post("/create-order", protect, createRazorpayOrder);
router.post("/verify-payment", protect, verifyRazorpayPayment);

// Wallet fund routes
router.post("/wallet/create-order", protect, createWalletFundOrder);
router.post("/wallet/verify", protect, verifyWalletFundPayment);

module.exports = router;