const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    getCart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
} = require("../controllers/cartController");

// ==========================================
// PROTECTED ROUTES (Token REQUIRED!)
// ==========================================

// Get user cart
router.get("/", protect, getCart);

// Add item to cart
router.post("/add", protect, addToCart);

// Update cart item quantity
router.put("/update/:productId", protect, updateCartQuantity);

// Remove item from cart
router.delete("/:productId", protect, removeFromCart);

module.exports = router;
