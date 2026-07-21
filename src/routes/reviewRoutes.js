const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const protect = require("../middleware/authMiddleware");

// Get all reviews for a product
router.get("/:productId", reviewController.getProductReviews);

// Check if user can review a product
router.get("/:productId/user-status", protect, reviewController.getUserReviewStatus);

// Add a review
router.post("/:productId", protect, reviewController.addReview);

// Update a review
router.put("/:reviewId", protect, reviewController.updateReview);

// Delete a review
router.delete("/:reviewId", protect, reviewController.deleteReview);

module.exports = router;
