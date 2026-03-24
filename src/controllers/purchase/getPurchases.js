const Purchase = require("../../models/Purchase");

/**
 * Get all purchases with populated supplier and product info
 */
const getPurchases = async (req, res, next) => {
  try {
    const purchases = await Purchase.find().populate("supplier").populate("items.product").sort({ createdAt: -1 });
    res.json(purchases);
  } catch (error) {
    console.error("GET PURCHASES ERROR:", error);
    next(error);
  }
};

module.exports = getPurchases;
