const User = require("../../models/User");

/**
 * Toggle block status of a user (Admin)
 */
const toggleBlockUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: "Cannot block an admin user" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User successfully ${user.isBlocked ? 'blocked' : 'unblocked'}`,
      isBlocked: user.isBlocked
    });
  } catch (error) {
    console.error("TOGGLE BLOCK USER ERROR:", error);
    next(error);
  }
};

module.exports = toggleBlockUser;
