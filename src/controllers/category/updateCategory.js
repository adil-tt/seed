const Category = require("../../models/Category");

/**
 * Update a category (using save() to trigger pre-save slug hooks)
 */
const updateCategory = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;
    const updateData = { name, description, status };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    Object.assign(category, updateData);
    await category.save();

    res.json({ message: "Category updated successfully", category });
  } catch (error) {
    console.error("UPDATE CATEGORY ERROR:", error);
    next(error);
  }
};

module.exports = updateCategory;
