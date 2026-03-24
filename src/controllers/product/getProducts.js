const Product = require("../../models/Product");

/**
 * Get all products (populated with category)
 */
const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate("categories", "name")
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    next(error);
  }
};

module.exports = getProducts;
