const Purchase = require("../../models/Purchase");

/**
 * Get a single purchase with populated supplier and product info
 */
const getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("supplier")
      .populate("items.product");
      
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }
    res.json(purchase);
  } catch (error) {
    console.error("GET PURCHASE BY ID ERROR:", error);
    next(error);
  }
};

module.exports = getPurchaseById;
