const Order = require("../../models/Order");

/**
 * Update delivery status of an order (Admin)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { deliveryStatus } = req.body;

    const validStatuses = ["Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Returned"];
    if (!validStatuses.includes(deliveryStatus)) {
      return res.status(400).json({ success: false, message: "Invalid delivery status" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.deliveryStatus = deliveryStatus;

    if (deliveryStatus === 'Delivered' && order.paymentMethod === 'COD' && order.paymentStatus === 'Pending') {
      order.paymentStatus = 'Completed';
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${deliveryStatus}`,
      order
    });
  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);
    next(error);
  }
};

module.exports = updateOrderStatus;
