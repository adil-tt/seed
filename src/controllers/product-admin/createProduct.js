const Product = require("../../models/Product");

/**
 * Create a new product (Admin)
 */
const createProduct = async (req, res, next) => {
  try {
    const { product_name, name, categories, ...otherDetails } = req.body;

    const product = new Product({
      name: name || product_name,
      categories: categories ? (Array.isArray(categories) ? categories : [categories]) : [],
      ...otherDetails,
      images: req.files ? req.files.map(file => file.filename) : []
    });

    await product.save();

    res.status(201).json({
      message: "Product created successfully",
      product
    });

  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    next(error);
  }
};

module.exports = createProduct;
