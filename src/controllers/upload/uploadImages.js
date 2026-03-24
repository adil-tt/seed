/**
 * Handle the response after Multer processes the images.
 */
const uploadImages = (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files were uploaded.'
      });
    }

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
    console.error('UPLOAD IMAGES ERROR:', error);
    next(error);
  }
};

module.exports = uploadImages;
