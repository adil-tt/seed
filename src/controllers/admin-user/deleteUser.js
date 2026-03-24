const User = require("../../models/User");

/**
 * Delete a user (Admin)
 */
const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: "Cannot delete an admin user" });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("DELETE USER ADMIN ERROR:", error);
    next(error);
  }
};

module.exports = deleteUser;
