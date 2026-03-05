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

    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    }],

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