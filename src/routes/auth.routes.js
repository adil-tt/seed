// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();

// Import the controller functions
const { registerUser, verifyOtp } = require("../controllers/authController");

// Route 1: Register a new user and send OTP
// POST /api/auth/signup
router.post("/signup", registerUser);

// Route 2: Verify the OTP sent to the email
// POST /api/auth/verify-otp
router.post("/verify-otp", verifyOtp);

module.exports = router;