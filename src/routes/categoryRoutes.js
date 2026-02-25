const express = require("express");
const router = express.Router();
const uploadCategory = require("../middleware/uploadMiddleware");
const {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

router.post("/", uploadCategory.single("image"), createCategory);
router.get("/", getCategories);
router.get("/:id", getCategory);
router.put("/:id", uploadCategory.single("image"), updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;