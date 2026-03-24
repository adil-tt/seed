const User = require("../../models/User");

/**
 * Remove item from wishlist
 */
const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const initialLength = user.wishlist.length;
    user.wishlist = user.wishlist.filter(
      (item) => item.product.toString() !== productId
    );

    if (user.wishlist.length === initialLength) {
      return res.status(404).json({ message: "Item not found in wishlist" });
    }

    await user.save();
    res.status(200).json({ message: "Item removed from wishlist", wishlist: user.wishlist });
  } catch (error) {
    console.error("REMOVE FROM WISHLIST ERROR:", error);
    next(error);
  }
};

module.exports = removeFromWishlist;
