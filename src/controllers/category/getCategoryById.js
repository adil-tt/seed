const Category = require("../../models/Category");

/**
 * Get a single category by ID
 */
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (error) {
    console.error("GET CATEGORY BY ID ERROR:", error);
    next(error);
  }
};

module.exports = getCategoryById;
