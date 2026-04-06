// src/middleware/adminMiddleware.js

const admin = (req, res, next) => {
  try {
    // 1. Check if user exists (set by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user not found",
      });
    }

    // 2. Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admins only",
      });
    }

    // 3. Allow access
    next();
  } catch (error) {
    console.error("Admin Middleware Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error in admin middleware",
    });
  }
};

module.exports = admin;