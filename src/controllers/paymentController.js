const crypto = require('crypto');
const Order = require('../models/Order');
const razorpay = require('../utils/razorpay');

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({ success: false, message: 'Amount and Order ID are required' });
    }

    // Razorpay expects amount in smallest currency unit (paise)
    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_order_${orderId}`
    };

    const razorpayOrder = await razorpay.orders.create(options);

    if (!razorpayOrder) {
      return res.status(500).json({ success: false, message: 'Some error occurred while creating Razorpay order' });
    }

    // Pass the key to the frontend so it doesn't need to be hardcoded in JS
    res.status(200).json({
      success: true,
      order: razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ success: false, message: 'Incomplete payment details provided' });
    }

    // Generate verification signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
      .update(sign.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    // Fetch Order and update status
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (isAuthentic) {
      // Update order payment status accurately according to Enum in Schema
      order.paymentStatus = "Completed";
      if (order.razorpayPaymentId !== undefined) {
        order.razorpayPaymentId = razorpay_payment_id;
      }
      await order.save();

      res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      order.paymentStatus = "Failed";
      await order.save();

      res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};