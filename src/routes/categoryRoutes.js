const express = require("express");
const router = express.Router();
const uploadCategory = require("../middleware/uploadMiddleware");

// Import modular actions
const createCategory = require("../controllers/category/createCategory");
const getCategories = require("../controllers/category/getCategories");
const getCategoryById = require("../controllers/category/getCategoryById");
const updateCategory = require("../controllers/category/updateCategory");
const deleteCategory = require("../controllers/category/deleteCategory");

// Routes
router.post("/", uploadCategory.single("image"), createCategory);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.put("/:id", uploadCategory.single("image"), updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;