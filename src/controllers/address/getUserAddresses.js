const User = require("../../models/User");

/**
 * Get all the authenticated user's saved addresses
 */
const getUserAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("addresses");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      addresses: user.addresses
    });

  } catch (error) {
    console.error("Error fetching addresses:", error);
    next(error);
  }
};

module.exports = getUserAddresses;
