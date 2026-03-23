const Coupon = require('../models/Coupon');

// @desc    Create a new coupon
// @route   POST /api/admin/coupons
// @access  Private/Admin
const createCoupon = async (req, res) => {
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
        console.error("Error creating coupon:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get all coupons
// @route   GET /api/admin/coupons
// @access  Private/Admin
const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        
        // Calculate stats
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
        console.error("Error fetching coupons:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Update a coupon
// @route   PUT /api/admin/coupons/:id
// @access  Private/Admin
const updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        // Just update the fields provided in body
        Object.assign(coupon, req.body);
        if (req.body.code) coupon.code = req.body.code.toUpperCase();

        await coupon.save();

        res.status(200).json({ success: true, message: "Coupon updated successfully", coupon });
    } catch (error) {
        console.error("Error updating coupon:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Delete a coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        res.status(200).json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
        console.error("Error deleting coupon:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    createCoupon,
    getCoupons,
    updateCoupon,
    deleteCoupon
};
