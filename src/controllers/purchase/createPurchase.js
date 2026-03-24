const Purchase = require("../../models/Purchase");
const Product = require("../../models/Product");

/**
 * Create a new purchase, validate batch unique IDs, and update product stock/price
 */
const createPurchase = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Purchase must contain at least one item." });
    }

    const incomingBatchNos = items.map(item => item.batchNo);

    const uniqueIncomingBatches = new Set(incomingBatchNos);
    if (uniqueIncomingBatches.size !== incomingBatchNos.length) {
      return res.status(400).json({ message: "Duplicate Batch IDs found within the current purchase request." });
    }

    const existingPurchaseWithBatches = await Purchase.findOne({
      "items.batchNo": { $in: incomingBatchNos }
    });

    if (existingPurchaseWithBatches) {
      const duplicateBatches = existingPurchaseWithBatches.items
        .filter(item => incomingBatchNos.includes(item.batchNo))
        .map(item => item.batchNo);

      return res.status(400).json({ message: `Validation Error: Batch ID(s) ${duplicateBatches.join(', ')} already exists.` });
    }

    const purchase = new Purchase(req.body);
    await purchase.save();

    for (const item of req.body.items) {
      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: { stock: item.quantity },
          $set: { price: item.sellingPrice }
        }
      );
    }

    res.status(201).json({ message: "Purchase saved & stock updated" });

  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error("CREATE PURCHASE ERROR:", error);
    next(error);
  }
};

module.exports = createPurchase;
