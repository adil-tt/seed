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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
      },
      orders: orders,
      pagination: {
        totalOrders,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error("GET MY ORDERS ERROR:", error);
    next(error);
  }
};

module.exports = getMyOrders;
