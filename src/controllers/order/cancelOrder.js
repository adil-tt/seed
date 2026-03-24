const Order = require("../../models/Order");
const Product = require("../../models/Product");

/**
 * Cancel an entire order
 */
const cancelOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.deliveryStatus !== "Processing") {
      return res.status(400).json({ success: false, message: "Only processing orders can be cancelled." });
    }

    let refundAmount = 0;
    for (const item of order.products) {
      if (!item.isCancelled) {
        item.isCancelled = true;
        refundAmount += (item.price * item.quantity);
        
        const productDoc = await Product.findById(item.product);
        if (productDoc) {
          productDoc.stock += item.quantity;
          await productDoc.save();
        }
      }
    }

    order.totalAmount -= refundAmount;
    order.deliveryStatus = "Cancelled";
    order.paymentStatus = (order.paymentMethod === "COD") ? "Cancelled" : "Refunded";

    await order.save();
    res.status(200).json({ success: true, message: "Order cancelled successfully", order });

  } catch (error) {
    console.error("CANCEL ORDER ERROR:", error);
    next(error);
  }
};

module.exports = cancelOrder;
