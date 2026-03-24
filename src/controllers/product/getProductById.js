const Product = require("../../models/Product");

/**
 * Get a single product by ID
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate("categories", "name");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("GET PRODUCT BY ID ERROR:", error);
    next(error);
  }
};

module.exports = getProductById;
