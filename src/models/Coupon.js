const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    applicableOn: { type: String, enum: ['Everywhere', 'Category', 'Product'], default: 'Everywhere' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    visibleToUsers: { type: Boolean, default: false },
    valueType: { type: String, enum: ['Percentage', 'Fixed Amount'], default: 'Percentage' },
    discountValue: { type: Number, required: true },
    minPurchase: { type: Number, default: 0 },
    maxCap: { type: Number }, // Only relevant if percentage
    allowOnSaleProducts: { type: Boolean, default: false },
    totalLimit: { type: Number },
    perUserLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    startDate: { type: Date },
    expiryDate: { type: Date }
}, {
    timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
