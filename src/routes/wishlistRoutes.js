const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Import modular actions from wishlist subfolder
const getWishlist = require("../controllers/wishlist/getWishlist");
const addToWishlist = require("../controllers/wishlist/addToWishlist");
const removeFromWishlist = require("../controllers/wishlist/removeFromWishlist");
const moveWishlistToCart = require("../controllers/wishlist/moveWishlistToCart");

// Routes
router.get("/", protect, getWishlist);
router.post("/add", protect, addToWishlist);
router.delete("/:productId", protect, removeFromWishlist);
router.post("/move-to-cart", protect, moveWishlistToCart);

module.exports = router;
