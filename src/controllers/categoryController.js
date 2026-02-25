const Category = require("../models/Category");
const slugify = require("slugify");

// CREATE CATEGORY
exports.createCategory = async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
};

// GET ALL CATEGORIES WITH PAGINATION
exports.getCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Category.countDocuments();
    const categories = await Category.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      categories,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalCategories: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET SINGLE CATEGORY
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE CATEGORY
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const updateData = { name, description, status };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    // We use save() instead of findByIdAndUpdate to trigger the pre-save hook for slug if name changes
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    Object.assign(category, updateData);
    await category.save();

    res.json({ message: "Category updated successfully", category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE CATEGORY
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};