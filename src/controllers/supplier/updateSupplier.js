const Supplier = require("../../models/Supplier");

/**
 * Update an existing supplier by ID
 */
const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.json({
      success: true,
      message: "Supplier updated successfully",
      supplier
    });
  } catch (error) {
    console.error("UPDATE SUPPLIER ERROR:", error);
    next(error);
  }
};

module.exports = updateSupplier;
