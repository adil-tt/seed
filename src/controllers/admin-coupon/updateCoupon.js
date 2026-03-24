const Coupon = require('../../models/Coupon');

/**
 * Update a coupon (Admin)
 */
const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    Object.assign(coupon, req.body);
    if (req.body.code) coupon.code = req.body.code.toUpperCase();

    await coupon.save();
    res.status(200).json({ success: true, message: "Coupon updated successfully", coupon });
  } catch (error) {
    console.error("UPDATE COUPON ADMIN ERROR:", error);
    next(error);
  }
};

module.exports = updateCoupon;
