const User = require("../../models/User");

/**
 * Get user cart (populated with product)
 */
const getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("cart.product");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.cart);
  } catch (error) {
    console.error("GET CART ERROR:", error);
    next(error);
  }
};

module.exports = getCart;
