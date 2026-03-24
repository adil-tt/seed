const Offer = require('../../models/Offer');

/**
 * Get all offers (Admin)
 */
const getOffers = async (req, res, next) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, offers });
  } catch (error) {
    console.error("GET OFFERS ADMIN ERROR:", error);
    next(error);
  }
};

module.exports = getOffers;
