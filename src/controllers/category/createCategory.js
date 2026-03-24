const Category = require("../../models/Category");

/**
 * Create a new category
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;

    const category = new Category({
      name,
      description,
      status,
      image: req.file ? req.file.filename : null,
    });

    await category.save();
    res.status(201).json({ message: "Category created successfully", category });
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);
    next(error);
  }
};

module.exports = createCategory;
