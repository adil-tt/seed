const Supplier = require("../../models/Supplier");

/**
 * Delete a supplier by ID
 */
const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.json({ success: true, message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("DELETE SUPPLIER ERROR:", error);
    next(error);
  }
};

module.exports = deleteSupplier;
