// src/middleware/userMiddleware.js

const userOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user not found",
      });
    }

    if (req.user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admins cannot access user features",
      });
    }

    next();
  } catch (error) {
    console.error("User Middleware Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error in user middleware",
    });
  }
};

module.exports = userOnly;
