const Coupon = require('../models/Coupon');

// @desc    Get available coupons for users
// @route   GET /api/user/coupons/available
// @access  Public
const getAvailableCoupons = async (req, res) => {
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
        console.error("Error fetching available coupons:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    getAvailableCoupons
};
