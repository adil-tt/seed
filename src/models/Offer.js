const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    bannerImage: {
        type: String, // URL/Path to the image
        required: true
    },
    offerType: {
        type: String,
        enum: ['Category', 'Product', 'All'],
        default: 'Category'
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'offerType', // This can be Category or Product model
        required: function() { return this.offerType !== 'All'; }
    },
    discountType: {
        type: String,
        enum: ['Percentage', 'Fixed Amount'],
        default: 'Percentage'
    },
    discountValue: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
