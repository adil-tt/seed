const User = require("../../models/User");
const Product = require("../../models/Product");

/**
 * Update cart item quantity with stock validation
 */
const updateCartQuantity = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Valid quantity is required" });
    }

    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (quantity > productExists.stock) {
      return res.status(400).json({ message: `Cannot update quantity to more than available stock (${productExists.stock})` });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cartItem = user.cart.find((item) => item.product.toString() === productId);
    if (!cartItem) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    cartItem.quantity = Number(quantity);
    await user.save();

    res.status(200).json({ message: "Cart updated", cart: user.cart });
  } catch (error) {
    console.error("UPDATE CART QUANTITY ERROR:", error);
    next(error);
  }
};

module.exports = updateCartQuantity;
