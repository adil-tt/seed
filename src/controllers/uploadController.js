/**
 * CONTROLLER: Image Upload Controller
 * Handles the response after Multer processes the images.
 */

const uploadImages = (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files were uploaded.'
            });
        }

        // Map the uploaded files to get their paths/filenames
        const uploadedFiles = req.files.map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            path: `/uploads/${file.filename}`,
            size: file.size
        }));

        res.status(200).json({
            success: true,
            message: `${req.files.length} images uploaded successfully.`,
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Upload Controller Error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during file upload.',
            error: error.message
        });
    }
};

module.exports = {
    uploadImages
};
