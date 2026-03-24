const razorpay = require('../../utils/razorpay');

/**
 * Create a Razorpay order for wallet funding
 */
const createWalletFundOrder = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount provided' });
    }

    console.log("Create Wallet Fund Order Request Body:", req.body);
    console.log("User ID from Middleware:", req.user ? req.user._id : "NOT_FOUND");

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `rct_wlt_${req.user._id.toString().slice(-10)}_${Date.now()}`
    };

    console.log("Razorpay Order Options:", options);

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create(options);
    } catch (razorpayError) {
      console.error("RAZORPAY API ERROR:", razorpayError);
      return res.status(502).json({ 
        success: false, 
        message: 'Error interacting with Razorpay API',
        error: razorpayError.message 
      });
    }

    if (!razorpayOrder) {
      return res.status(500).json({ success: false, message: 'Failed to create Razorpay order for wallet' });
    }

    res.status(200).json({
      success: true,
      order: razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("CREATE WALLET FUND ORDER ERROR:", error);
    next(error);
  }
};

module.exports = createWalletFundOrder;
