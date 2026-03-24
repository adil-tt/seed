const Offer = require('../../models/Offer');

/**
 * Get all active offers for home page based on status and date range
 */
const getActiveOffers = async (req, res, next) => {
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
    console.error('GET ACTIVE OFFERS ERROR:', error);
    next(error);
  }
};

module.exports = getActiveOffers;
