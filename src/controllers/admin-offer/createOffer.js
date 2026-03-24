const Offer = require('../../models/Offer');

/**
 * Create a new offer (Admin)
 */
const createOffer = async (req, res, next) => {
  try {
    const {
      title,
      bannerImage,
      offerType,
      targetId,
      discountType,
      discountValue,
      startDate,
      endDate,
      description,
      isActive
    } = req.body;

    if (!title || !bannerImage || !discountValue || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const newOffer = new Offer({
      title,
      bannerImage,
      offerType,
      targetTargetId: targetId === "" ? null : targetId,
      targetId: targetId || null,
      discountType,
      discountValue,
      startDate,
      endDate,
      description,
      isActive: isActive !== undefined ? isActive : true
    });

    await newOffer.save();
    res.status(201).json({ success: true, message: 'Offer created successfully', offer: newOffer });
  } catch (error) {
    console.error("CREATE OFFER ADMIN ERROR:", error);
    next(error);
  }
};

module.exports = createOffer;
