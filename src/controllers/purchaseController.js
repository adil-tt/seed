const Purchase = require("../models/Purchase");
const Product = require("../models/Product");

exports.createPurchase = async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Purchase must contain at least one item." });
        }

        // Validate batchNo uniqueness across all purchases
        const incomingBatchNos = items.map(item => item.batchNo);

        // Check for duplicates inside the current request itself
        const uniqueIncomingBatches = new Set(incomingBatchNos);
        if (uniqueIncomingBatches.size !== incomingBatchNos.length) {
            return res.status(400).json({ message: "Duplicate Batch IDs found within the current purchase request." });
        }

        // Check against existing database records
        const existingPurchaseWithBatches = await Purchase.findOne({
            "items.batchNo": { $in: incomingBatchNos }
        });

        if (existingPurchaseWithBatches) {
            // Find which exact batch is duplicate for a better error message
            const duplicateBatches = existingPurchaseWithBatches.items
                .filter(item => incomingBatchNos.includes(item.batchNo))
                .map(item => item.batchNo);

            return res.status(400).json({ message: `Validation Error: Batch ID(s) ${duplicateBatches.join(', ')} already exists.` });
        }

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
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        console.error("Purchase Creation Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.find().populate("supplier").populate("items.product").sort({ createdAt: -1 });
        res.json(purchases);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};