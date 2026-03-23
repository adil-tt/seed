const Offer = require('../models/Offer');

// @desc    Get all active offers for home page
// @route   GET /api/offers/active
// @access  Public
exports.getActiveOffers = async (req, res) => {
    try {
        const now = new Date();
        const offers = await Offer.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: offers.length,
            offers
        });
    } catch (error) {
        console.error('Get Active Offers Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
