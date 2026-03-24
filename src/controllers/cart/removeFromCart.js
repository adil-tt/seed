const User = require("../../models/User");

/**
 * Remove item from user's cart
 */
const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const initialCartLength = user.cart.length;
    user.cart = user.cart.filter((item) => item.product.toString() !== productId);

    if (user.cart.length === initialCartLength) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    await user.save();
    res.status(200).json({ message: "Item removed from cart", cart: user.cart });
  } catch (error) {
    console.error("REMOVE FROM CART ERROR:", error);
    next(error);
  }
};

module.exports = removeFromCart;
