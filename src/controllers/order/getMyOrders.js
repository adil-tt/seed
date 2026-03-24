const Order = require("../../models/Order");
const User = require("../../models/User");

/**
 * Get the authenticated user's order history
 */
const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("name email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
      },
      orders: orders,
    });
  } catch (error) {
    console.error("GET MY ORDERS ERROR:", error);
    next(error);
  }
};

module.exports = getMyOrders;
