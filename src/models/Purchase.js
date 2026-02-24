const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supplier"
    },
    invoiceNumber: String,
    purchaseDate: Date,
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
            quantity: Number,
            purchasePrice: Number
        }
    ],
    totalAmount: Number
}, { timestamps: true });

module.exports = mongoose.model("Purchase", purchaseSchema);