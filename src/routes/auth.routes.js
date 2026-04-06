const express = require("express");
const router = express.Router();

// Controllers
const signup = require("../controllers/auth/signup");
const verifyOtp = require("../controllers/auth/verifyOtp");
const loginUser = require("../controllers/auth/loginUser");
const forgotPassword = require("../controllers/auth/forgotPassword");
const resetPassword = require("../controllers/auth/resetPassword");

const updateProfile = require("../controllers/user/updateProfile");
const getProfile = require("../controllers/user/getProfile");

// Middleware
const protect = require("../middleware/authMiddleware");

// Upload
const upload = require("../middleware/upload");

// PUBLIC
router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// PROTECTED
router.get("/profile", protect, getProfile);
router.put("/profile", protect, upload.single("profileImage"), updateProfile);

module.exports = router;