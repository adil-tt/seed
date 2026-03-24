const Offer = require('../../models/Offer');

/**
 * Delete an offer (Admin)
 */
const deleteOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    await offer.deleteOne();
    res.status(200).json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    console.error("DELETE OFFER ADMIN ERROR:", error);
    next(error);
  }
};

module.exports = deleteOffer;
