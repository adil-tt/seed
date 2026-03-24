const Product = require("../../models/Product");

/**
 * Update a product (Admin)
 */
const updateProduct = async (req, res, next) => {
  try {
    const { product_name, name, categories, ...otherDetails } = req.body;
    const updateData = {
      name: name || product_name,
      ...otherDetails
    };

    if (categories !== undefined) {
      updateData.categories = Array.isArray(categories) ? categories : [categories];
    }

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => file.filename);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product updated successfully", product });

  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    next(error);
  }
};

module.exports = updateProduct;
