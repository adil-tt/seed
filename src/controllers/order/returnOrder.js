const Order = require("../../models/Order");
const User = require("../../models/User");
const Product = require("../../models/Product");

/**
 * Return an entire order (Refund to Wallet)
 */
const returnOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { reason, details } = req.body;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.deliveryStatus !== "Delivered") {
      return res.status(400).json({ success: false, message: "Only delivered orders can be returned." });
    }

    order.deliveryStatus = "Returned";
    order.paymentStatus = "Refunded"; 
    order.returnReason = reason || "Not Specified";
    order.returnDetails = details || "";

    for (const item of order.products) {
      if (!item.isCancelled) {
        item.isCancelled = true;
        const productDoc = await Product.findById(item.product);
        if (productDoc) {
          productDoc.stock += item.quantity;
          await productDoc.save();
        }
      }
    }

    // Refund to Wallet
    const user = await User.findById(userId);
    if (user) {
      user.walletBalance = (user.walletBalance || 0) + order.totalAmount;
      user.walletTransactions.push({
        amount: order.totalAmount,
        type: 'credit',
        description: `Refund for returned order #${order._id.toString().substring(0, 8).toUpperCase()}`
      });
      await user.save();
    }

    await order.save();
    res.status(200).json({ success: true, message: "Order returned successfully, amount credited to wallet.", order });

  } catch (error) {
    console.error("RETURN ORDER ERROR:", error);
    next(error);
  }
};

module.exports = returnOrder;
