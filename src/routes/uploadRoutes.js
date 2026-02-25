const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadImages } = require('../controllers/uploadController');

/**
 * ROUTE: Image Upload Route
 * POST /api/upload
 * Configured to accept up to 3 images per request under the field name 'images'.
 */
router.post('/', upload.array('images', 3), uploadImages);

module.exports = router;
