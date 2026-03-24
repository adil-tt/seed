const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

// Import modular actions
const createProduct = require("../controllers/product-admin/createProduct");
const updateProduct = require("../controllers/product-admin/updateProduct");
const deleteProduct = require("../controllers/product-admin/deleteProduct");
const getProducts = require("../controllers/product/getProducts");
const getProductById = require("../controllers/product/getProductById");

// Routes
router.post("/", upload.array("images", 3), createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", upload.array("images", 3), updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;