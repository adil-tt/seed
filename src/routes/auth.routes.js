
const express = require("express");
const router = express.Router();

// 1. Import ALL your controller functions 
const {
  registerUser,
  verifyOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  updateProfile
} = require("../controllers/authController");

// 2. Import your new Auth Middleware
const { protect } = require("../middleware/authMiddleware");

// 3. Import Multer Upload Middleware for Profile Images
const upload = require("../middleware/upload");

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

// Update Profile route (handles text fields + profileImage upload)
router.put("/profile", protect, upload.single("profileImage"), updateProfile);

module.exports = router;