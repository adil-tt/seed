const Order = require("../../models/Order");
const Product = require("../../models/Product");

/**
 * Cancel a single item from an order
 */
const cancelOrderItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderId, productId } = req.params;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.deliveryStatus !== "Processing") {
      return res.status(400).json({ success: false, message: "Cannot cancel item. Order is already processed." });
    }

    const productItem = order.products.find(item => item.product.toString() === productId);
    if (!productItem) {
      return res.status(404).json({ success: false, message: "Product not found in this order" });
    }

    if (productItem.isCancelled) {
      return res.status(400).json({ success: false, message: "Product is already cancelled" });
    }

    productItem.isCancelled = true;

    const refundAmount = productItem.price * productItem.quantity;
    order.totalAmount -= refundAmount;

    const allCancelled = order.products.every(item => item.isCancelled);
    if (allCancelled) {
      order.deliveryStatus = "Cancelled";
      order.paymentStatus = order.paymentMethod === "COD" ? "Cancelled" : "Refunded";
    }

    await order.save();

    const productDoc = await Product.findById(productId);
    if (productDoc) {
      productDoc.stock += productItem.quantity;
      await productDoc.save();
    }

    res.status(200).json({ success: true, message: "Item cancelled successfully", order });

  } catch (error) {
    console.error("CANCEL ORDER ITEM ERROR:", error);
    next(error);
  }
};

module.exports = cancelOrderItem;
