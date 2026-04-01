const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload"); // Multer config
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

// Import modular action from upload subfolder
const uploadImages = require("../controllers/upload/uploadImages");

/**
 * Route: POST /api/upload
 * Multer handles file parsing, then uploadImages sends the response.
 */
router.post("/", protect, admin, upload.array("images", 10), uploadImages);

module.exports = router;
