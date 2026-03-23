const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');
const razorpay = require('../utils/razorpay');

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({ success: false, message: 'Amount and Order ID are required' });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_order_${orderId}`
    };

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create(options);
    } catch (apiError) {
      if (apiError instanceof TypeError && apiError.message.includes('status')) {
        // Razorpay SDK bug: throws TypeError when network fails or response is missing
        return res.status(502).json({ success: false, message: 'Payment gateway unavailable. Please check internet connection or try again later.' });
      }
      throw apiError;
    }

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
    res.status(500).json({ success: false, message: 'Server error', error: error.message || error });
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

      // Clear the user's cart
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
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.createWalletFundOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount provided' });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_wallet_${req.user._id}_${Date.now()}`
    };

    const razorpayOrder = await razorpay.orders.create(options);

    if (!razorpayOrder) {
      return res.status(500).json({ success: false, message: 'Failed to create Razorpay order for wallet' });
    }

    res.status(200).json({
      success: true,
      order: razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Error creating wallet fund order:", error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.verifyWalletFundPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
      return res.status(400).json({ success: false, message: 'Incomplete payment details or amount' });
    }

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Success - update wallet
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const fundAmount = parseFloat(amount);
    user.walletBalance = (user.walletBalance || 0) + fundAmount;
    
    user.walletTransactions.push({
      amount: fundAmount,
      type: 'credit',
      description: `Wallet Top-up via Razorpay (${razorpay_payment_id})`,
      date: new Date()
    });

    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Wallet balance updated successfully',
      newBalance: user.walletBalance
    });

  } catch (error) {
    console.error("Error verifying wallet payment:", error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};