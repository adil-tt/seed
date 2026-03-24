const User = require("../../models/User");

/**
 * Move all items from user's wishlist to their cart
 */
const moveWishlistToCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.wishlist.length === 0) {
      return res.status(400).json({ message: "Wishlist is empty" });
    }

    user.wishlist.forEach(item => {
      const productId = item.product.toString();
      const existingCartItemIndex = user.cart.findIndex(
        (cartItem) => cartItem.product.toString() === productId
      );

      if (existingCartItemIndex > -1) {
        user.cart[existingCartItemIndex].quantity += 1;
      } else {
        user.cart.push({ product: productId, quantity: 1 });
      }
    });

    user.wishlist = [];
    await user.save();

    res.status(200).json({ message: "All items moved to cart", cart: user.cart, wishlist: user.wishlist });
  } catch (error) {
    console.error("MOVE WISHLIST TO CART ERROR:", error);
    next(error);
  }
};

module.exports = moveWishlistToCart;
