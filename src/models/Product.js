const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    brand: String,
    price: {
        type: Number,
        required: true,
        default: 0
    },
    description: String,

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },

    images: [String],

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },

    stock: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);