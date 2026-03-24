const Category = require("../../models/Category");

/**
 * Get all categories with pagination and status filtering
 */
const getCategories = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const total = await Category.countDocuments(filter);
    const categories = await Category.find(filter)
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
    console.error("GET CATEGORIES ERROR:", error);
    next(error);
  }
};

module.exports = getCategories;
