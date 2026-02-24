const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { createProduct, getProducts } = require("../controllers/productController");

// Upload single image
router.post("/", upload.single("image"), createProduct);

router.get("/", getProducts);

module.exports = router;