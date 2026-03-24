const Offer = require('../../models/Offer');

/**
 * Update an offer (Admin)
 */
const updateOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    const updatedOffer = await Offer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, message: 'Offer updated successfully', offer: updatedOffer });
  } catch (error) {
    console.error("UPDATE OFFER ADMIN ERROR:", error);
    next(error);
  }
};

module.exports = updateOffer;
