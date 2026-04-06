const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

// ✅ FIXED IMPORTS (no {})
const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

// Controllers
const createProduct = require("../controllers/product-admin/createProduct");
const updateProduct = require("../controllers/product-admin/updateProduct");
const deleteProduct = require("../controllers/product-admin/deleteProduct");
const getProducts = require("../controllers/product/getProducts");
const getProductById = require("../controllers/product/getProductById");

// ✅ Routes

// Create Product (Admin only)
router.post("/", protect, admin, upload.array("images", 3), createProduct);

// Get All Products (Public)
router.get("/", getProducts);

// Get Single Product (Public)
router.get("/:id", getProductById);

// Update Product (Admin only)
router.put("/:id", protect, admin, upload.array("images", 3), updateProduct);

// Delete Product (Admin only)
router.delete("/:id", protect, admin, deleteProduct);

module.exports = router;