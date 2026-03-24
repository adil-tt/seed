const Supplier = require("../../models/Supplier");

/**
 * Create a new supplier
 */
const createSupplier = async (req, res, next) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json({ success: true, message: "Supplier created", supplier });
  } catch (error) {
    console.error("CREATE SUPPLIER ERROR:", error);
    next(error);
  }
};

module.exports = createSupplier;
