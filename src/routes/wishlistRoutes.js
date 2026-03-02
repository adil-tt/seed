const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    moveWishlistToCart
} = require("../controllers/wishlistController");

// ==========================================
// PROTECTED ROUTES (Token REQUIRED!)
// ==========================================

// Get user wishlist
router.get("/", protect, getWishlist);

// Add item to wishlist
router.post("/add", protect, addToWishlist);

// Remove item from wishlist
router.delete("/:productId", protect, removeFromWishlist);

// Move all items from wishlist to cart
router.post("/move-to-cart", protect, moveWishlistToCart);

module.exports = router;
