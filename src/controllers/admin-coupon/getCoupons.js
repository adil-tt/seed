const Coupon = require('../../models/Coupon');

/**
 * Get all coupons with stats (Admin)
 */
const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    
    const totalCoupons = coupons.length;
    const now = new Date();
    const activeCoupons = coupons.filter(c => 
      c.status === 'Active' && 
      (!c.expiryDate || new Date(c.expiryDate) > now)
    ).length;
    const expiredCoupons = totalCoupons - activeCoupons;
    const totalUsage = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

    res.status(200).json({ 
      success: true, 
      coupons,
      stats: {
        totalCoupons,
        activeCoupons,
        expiredCoupons,
        totalUsage
      }
    });
  } catch (error) {
    console.error("GET COUPONS ADMIN ERROR:", error);
    next(error);
  }
};

module.exports = getCoupons;
