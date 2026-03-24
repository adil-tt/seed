const User = require("../../models/User");
const Order = require("../../models/Order");

/**
 * Get detailed user info including orders summary (Admin)
 */
const getUserDetails = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password -otp -otpExpiry");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.deliveryStatus === 'Delivered').length;
    const canceledOrders = orders.filter(o => o.deliveryStatus === 'Cancelled' || o.deliveryStatus === 'Returned').length;

    let lastPurchaseDate = null;
    if (orders.length > 0) {
      lastPurchaseDate = orders[0].createdAt;
    }

    res.status(200).json({
      success: true,
      user,
      stats: {
        totalOrders,
        completedOrders,
        canceledOrders,
        lastPurchaseDate
      }
    });
  } catch (error) {
    console.error("GET USER DETAILS ADMIN ERROR:", error);
    next(error);
  }
};

module.exports = getUserDetails;
