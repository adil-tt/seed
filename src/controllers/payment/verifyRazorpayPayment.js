const crypto = require('crypto');
const Order = require('../../models/Order');
const User = require('../../models/User');

/**
 * Verify Razorpay payment signature and update order
 */
const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ success: false, message: 'Incomplete payment details provided' });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
      .update(sign.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (isAuthentic) {
      order.paymentStatus = "Completed";
      if (order.razorpayPaymentId !== undefined) {
        order.razorpayPaymentId = razorpay_payment_id;
      }
      await order.save();

      const user = await User.findById(order.user);
      if (user) {
        user.cart = [];
        await user.save();
      }

      res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      order.paymentStatus = "Failed";
      await order.save();
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error("VERIFY RAZORPAY PAYMENT ERROR:", error);
    next(error);
  }
};

module.exports = verifyRazorpayPayment;
