const Supplier = require("../../models/Supplier");

/**
 * Get a single supplier by ID
 */
const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.json(supplier);
  } catch (error) {
    console.error("GET SUPPLIER BY ID ERROR:", error);
    next(error);
  }
};

module.exports = getSupplierById;
