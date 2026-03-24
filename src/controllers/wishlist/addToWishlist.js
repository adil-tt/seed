const User = require("../../models/User");
const Product = require("../../models/Product");

/**
 * Add item to wishlist
 */
const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const exists = user.wishlist.some((item) => {
      const currentId = item.product && item.product._id ? item.product._id.toString() : item.product?.toString();
      return currentId === productId.toString();
    });

    if (exists) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    user.wishlist.push({ product: productId });
    await user.save();

    res.status(200).json({ message: "Item added to wishlist", wishlist: user.wishlist });
  } catch (error) {
    console.error("ADD TO WISHLIST ERROR:", error);
    next(error);
  }
};

module.exports = addToWishlist;
