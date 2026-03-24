const User = require("../../models/User");
const Product = require("../../models/Product");

/**
 * Add item to cart with stock validation
 */
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

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

    const existingCartItemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    let newQuantity = Number(quantity);
    if (existingCartItemIndex > -1) {
      newQuantity += user.cart[existingCartItemIndex].quantity;
    }

    if (newQuantity > productExists.stock) {
      return res.status(400).json({ message: `Cannot add more than available stock (${productExists.stock})` });
    }

    if (existingCartItemIndex > -1) {
      user.cart[existingCartItemIndex].quantity = newQuantity;
    } else {
      user.cart.push({ product: productId, quantity: Number(quantity) });
    }

    await user.save();
    res.status(200).json({ message: "Item added to cart", cart: user.cart });
  } catch (error) {
    console.error("ADD TO CART ERROR:", error);
    next(error);
  }
};

module.exports = addToCart;
