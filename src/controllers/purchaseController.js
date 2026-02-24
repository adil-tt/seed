const Purchase = require("../models/Purchase");
const Product = require("../models/Product");

exports.createPurchase = async (req, res) => {
    try {
        const purchase = new Purchase(req.body);
        await purchase.save();

        // 🔥 Update stock
        for (const item of req.body.items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: item.quantity } }
            );
        }

        res.status(201).json({ message: "Purchase saved & stock updated" });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};