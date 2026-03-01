
const express = require("express");
const router = express.Router();

// 1. Import ALL your controller functions 
const { 
  registerUser, 
  verifyOtp, 
  loginUser, 
  forgotPassword, 
  resetPassword 
} = require("../controllers/authController");

// 2. Import your new Auth Middleware
const { protect } = require("../middleware/authMiddleware");

// ==========================================
// PUBLIC ROUTES (No token required)
// ==========================================
router.post("/signup", registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ==========================================
// PROTECTED ROUTES (Token REQUIRED!)
// ==========================================
// Example: A user requesting their own profile details
router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    message: "Secure route accessed successfully!",
    user: req.user
  });
});

module.exports = router;