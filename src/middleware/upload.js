const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * CONFIG: Multer Configuration
 * 1. Ensures the upload directory exists (Fixes ENOENT error).
 * 2. Handles file naming and destination.
 * 3. Implements file type and size validation.
 */

// Define upload directory - path.join is used for cross-platform compatibility (Windows/Linux)
// This points to a folder named 'uploads' at the project root
const uploadDir = path.join(__dirname, '../../uploads');

// AUTOMATIC DIRECTORY CREATION: This block fixes the ENOENT error
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created directory: ${uploadDir}`);
}

// STORAGE CONFIGURATION
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate a unique filename: timestamp-random-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        const fileName = path.basename(file.originalname, fileExt).replace(/\s+/g, '-');
        cb(null, `${fileName}-${uniqueSuffix}${fileExt}`);
    }
});

// FILE FILTER: Only allow specific image types
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Only images (jpeg, jpg, png, webp) are allowed!'), false);
    }
};

// INITIALIZE MULTER
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
    },
    fileFilter: fileFilter
});

module.exports = upload;