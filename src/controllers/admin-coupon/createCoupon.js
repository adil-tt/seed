const Coupon = require('../../models/Coupon');

/**
 * Create a new coupon (Admin)
 */
const createCoupon = async (req, res, next) => {
  try {
    const {
      title, code, description, applicableOn, status, visibleToUsers,
      valueType, discountValue, minPurchase, maxCap, allowOnSaleProducts,
      totalLimit, perUserLimit, startDate, expiryDate
    } = req.body;

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ success: false, message: "Coupon code already exists" });
    }

    const coupon = new Coupon({
      title, code: code.toUpperCase(), description, applicableOn, status, visibleToUsers,
      valueType, discountValue, minPurchase, maxCap, allowOnSaleProducts,
      totalLimit, perUserLimit, startDate, expiryDate
    });

    await coupon.save();
    res.status(201).json({ success: true, message: "Coupon created successfully", coupon });
  } catch (error) {
    console.error("CREATE COUPON ADMIN ERROR:", error);
    next(error);
  }
};

module.exports = createCoupon;
