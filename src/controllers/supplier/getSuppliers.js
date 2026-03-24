const Supplier = require("../../models/Supplier");

/**
 * Get all suppliers sorted by creation date
 */
const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (error) {
    console.error("GET SUPPLIERS ERROR:", error);
    next(error);
  }
};

module.exports = getSuppliers;
