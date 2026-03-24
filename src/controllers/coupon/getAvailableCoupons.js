const Coupon = require('../../models/Coupon');

/**
 * Get available coupons for users based on status, visibility, date range, and usage limits
 */
const getAvailableCoupons = async (req, res, next) => {
  try {
    const now = new Date();

    const coupons = await Coupon.find({
      status: 'Active',
      visibleToUsers: true,
      $or: [
        { startDate: null, expiryDate: null },
        { startDate: { $lte: now }, expiryDate: { $gte: now } },
        { startDate: { $lte: now }, expiryDate: null },
        { startDate: null, expiryDate: { $gte: now } }
      ],
      $expr: {
        $or: [
          { $eq: ["$totalLimit", null] },
          { $lt: ["$usedCount", "$totalLimit"] }
        ]
      }
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, coupons });
  } catch (error) {
    console.error("GET AVAILABLE COUPONS ERROR:", error);
    next(error);
  }
};

module.exports = getAvailableCoupons;
