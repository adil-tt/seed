const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Import modular actions from cart subfolder
const getCart = require("../controllers/cart/getCart");
const addToCart = require("../controllers/cart/addToCart");
const updateCartQuantity = require("../controllers/cart/updateCartQuantity");
const removeFromCart = require("../controllers/cart/removeFromCart");

// Routes
router.get("/", protect, getCart);
router.post("/add", protect, addToCart);
router.put("/update/:productId", protect, updateCartQuantity);
router.delete("/:productId", protect, removeFromCart);

module.exports = router;
