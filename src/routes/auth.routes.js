const express = require("express");
const router = express.Router();

// Import Auth Controller actions from subfolder
const signup = require("../controllers/auth/signup");
const verifyOtp = require("../controllers/auth/verifyOtp");
const loginUser = require("../controllers/auth/loginUser");
const forgotPassword = require("../controllers/auth/forgotPassword");
const resetPassword = require("../controllers/auth/resetPassword");

// Import User Controller actions from subfolder
const updateProfile = require("../controllers/user/updateProfile");
const getProfile = require("../controllers/user/getProfile");

// Import Auth Middleware
const { protect } = require("../middleware/authMiddleware");

// Import Multer Upload Middleware for Profile Images
const upload = require("../middleware/upload");

// ==========================================
// PUBLIC ROUTES (No token required)
// ==========================================
router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ==========================================
// PROTECTED ROUTES (Token REQUIRED!)
// ==========================================
router.get("/profile", protect, getProfile);

// Update Profile route (handles text fields + profileImage upload)
router.put("/profile", protect, upload.single("profileImage"), updateProfile);

module.exports = router;