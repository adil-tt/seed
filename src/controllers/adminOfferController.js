const Offer = require('../models/Offer');
const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc    Get all offers
// @route   GET /api/admin/offers
// @access  Private/Admin
exports.getOffers = async (req, res) => {
    try {
        const offers = await Offer.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, offers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new offer
// @route   POST /api/admin/offers
// @access  Private/Admin
exports.createOffer = async (req, res) => {
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

        // Basic validation
        if (!title || !bannerImage || !discountValue || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const newOffer = new Offer({
            title,
            bannerImage,
            offerType,
            targetTargetId: targetId === "" ? null : targetId, // Handle empty targetId for 'All'
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
        console.error('Create Offer Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update an offer
// @route   PUT /api/admin/offers/:id
// @access  Private/Admin
exports.updateOffer = async (req, res) => {
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete an offer
// @route   DELETE /api/admin/offers/:id
// @access  Private/Admin
exports.deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        await offer.deleteOne();
        res.status(200).json({ success: true, message: 'Offer deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
