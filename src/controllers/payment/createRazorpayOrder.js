const razorpay = require('../../utils/razorpay');

/**
 * Create a Razorpay order for checkout
 */
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({ success: false, message: 'Amount and Order ID are required' });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `rct_ord_${orderId.toString().slice(-10)}_${Date.now()}`
    };

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create(options);
    } catch (apiError) {
      if (apiError instanceof TypeError && apiError.message.includes('status')) {
        return res.status(502).json({ success: false, message: 'Payment gateway unavailable. Please check internet connection or try again later.' });
      }
      throw apiError;
    }

    if (!razorpayOrder) {
      return res.status(500).json({ success: false, message: 'Some error occurred while creating Razorpay order' });
    }

    res.status(200).json({
      success: true,
      order: razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("CREATE RAZORPAY ORDER ERROR:", error);
    next(error);
  }
};

module.exports = createRazorpayOrder;
