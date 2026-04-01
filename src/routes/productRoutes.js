const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

// Import modular actions
const createProduct = require("../controllers/product-admin/createProduct");
const updateProduct = require("../controllers/product-admin/updateProduct");
const deleteProduct = require("../controllers/product-admin/deleteProduct");
const getProducts = require("../controllers/product/getProducts");
const getProductById = require("../controllers/product/getProductById");

// Routes
router.post("/", protect, admin, upload.array("images", 3), createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", protect, admin, upload.array("images", 3), updateProduct);
router.delete("/:id", protect, admin, deleteProduct);

module.exports = router;