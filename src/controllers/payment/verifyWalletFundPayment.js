const crypto = require('crypto');
const User = require('../../models/User');

/**
 * Verify Razorpay payment signature for wallet funding and update balance
 */
const verifyWalletFundPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
      return res.status(400).json({ success: false, message: 'Incomplete payment details or amount' });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

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
    console.error("VERIFY WALLET PAYMENT ERROR:", error);
    next(error);
  }
};

module.exports = verifyWalletFundPayment;
