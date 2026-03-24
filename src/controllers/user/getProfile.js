/**
 * Get current user profile details
 */
const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      message: "Secure route accessed successfully!",
      user: req.user
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    next(error);
  }
};

module.exports = getProfile;
