const User = require("../../models/User");

/**
 * Get user wishlist (populated with product and categories)
 */
const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'wishlist.product',
      populate: { path: 'categories', select: 'name' }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.wishlist);
  } catch (error) {
    console.error("GET WISHLIST ERROR:", error);
    next(error);
  }
};

module.exports = getWishlist;
