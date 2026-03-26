const Purchase = require("../../models/Purchase");

/**
 * Update an existing purchase
 * Note: For now, only allows updating basic fields. 
 * Updating items would requires complex stock adjustment logic.
 */
const updatePurchase = async (req, res, next) => {
  try {
    const { supplier, invoiceNumber, purchaseDate } = req.body;
    
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    if (supplier) purchase.supplier = supplier;
    if (invoiceNumber !== undefined) purchase.invoiceNumber = invoiceNumber;
    if (purchaseDate) purchase.purchaseDate = purchaseDate;

    await purchase.save();
    
    // Populate before sending back
    await purchase.populate("supplier");
    
    res.json({ success: true, message: "Purchase updated successfully", purchase });
  } catch (error) {
    console.error("UPDATE PURCHASE ERROR:", error);
    next(error);
  }
};

module.exports = updatePurchase;
