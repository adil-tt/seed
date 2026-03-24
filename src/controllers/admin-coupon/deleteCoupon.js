const Coupon = require('../../models/Coupon');

/**
 * Delete a coupon (Admin)
 */
const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    res.status(200).json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("DELETE COUPON ADMIN ERROR:", error);
    next(error);
  }
};

module.exports = deleteCoupon;
