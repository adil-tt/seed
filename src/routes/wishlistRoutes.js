const express = require("express");
const router = express.Router();
const  protect  = require("../middleware/authMiddleware");
const userOnly = require("../middleware/userMiddleware");

// Import modular actions from wishlist subfolder
const getWishlist = require("../controllers/wishlist/getWishlist");
const addToWishlist = require("../controllers/wishlist/addToWishlist");
const removeFromWishlist = require("../controllers/wishlist/removeFromWishlist");
const moveWishlistToCart = require("../controllers/wishlist/moveWishlistToCart");

// Routes
router.get("/", protect, userOnly, getWishlist);
router.post("/add", protect, userOnly, addToWishlist);
router.delete("/:productId", protect, userOnly, removeFromWishlist);
router.post("/move-to-cart", protect, userOnly, moveWishlistToCart);

module.exports = router;
