const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        products: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                name: { type: String, required: true },
                image: { type: String },
                price: { type: Number, required: true },
                quantity: { type: Number, required: true, min: 1 },
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        shippingAddress: {
            fullName: { type: String, required: true },
            phone: { type: String, required: true },
            house: { type: String, required: true },
            street: { type: String, required: true },
            landmark: { type: String },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: { type: String, required: true },
        },
        paymentMethod: {
            type: String,
            required: true,
            enum: ["COD", "Razorpay", "Wallet"],
            default: "COD",
        },
        paymentStatus: {
            type: String,
            required: true,
            enum: ["Pending", "Completed", "Failed", "Refunded"],
            default: "Pending",
        },
        deliveryStatus: {
            type: String,
            required: true,
            enum: ["Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Returned"],
            default: "Processing",
        },
        trackingId: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
