const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { createProduct, getProducts, getProduct, updateProduct, deleteProduct } = require("../controllers/productController");

router.post("/", upload.array("images", 3), createProduct);
router.get("/", getProducts);
router.get("/:id", getProduct);
router.put("/:id", upload.array("images", 3), updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;