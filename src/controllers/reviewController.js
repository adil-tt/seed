const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");

// Calculate and update average rating for a product
const updateProductRating = async (productId) => {
    const stats = await Review.aggregate([
        { $match: { product: productId } },
        { $group: { _id: "$product", averageRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
        await Product.findByIdAndUpdate(productId, {
            averageRating: Math.round(stats[0].averageRating * 10) / 10,
            reviewCount: stats[0].reviewCount
        });
    } else {
        await Product.findByIdAndUpdate(productId, {
            averageRating: 0,
            reviewCount: 0
        });
    }
};

exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const reviews = await Review.find({ product: productId })
            .populate("user", "name profileImage firstName lastName")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await Review.countDocuments({ product: productId });

        res.json({
            reviews,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Server error fetching reviews." });
    }
};

exports.getUserReviewStatus = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        // Check if user has a delivered order for this product
        const order = await Order.findOne({
            user: userId,
            deliveryStatus: "Delivered",
            "products.product": productId
        });

        const hasPurchased = !!order;

        // Check if user already reviewed
        const existingReview = await Review.findOne({ user: userId, product: productId });

        res.json({
            hasPurchased,
            existingReview
        });
    } catch (error) {
        console.error("Error checking review status:", error);
        res.status(500).json({ message: "Server error checking review status." });
    }
};

exports.addReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, review } = req.body;
        const userId = req.user._id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Please provide a valid rating between 1 and 5." });
        }
        if (!review || review.trim().length < 10 || review.trim().length > 500) {
            return res.status(400).json({ message: "Review text must be between 10 and 500 characters." });
        }

        // Verify purchase
        const order = await Order.findOne({
            user: userId,
            deliveryStatus: "Delivered",
            "products.product": productId
        });

        if (!order) {
            return res.status(403).json({ message: "Only verified buyers who have received the product can review it." });
        }

        // Check existing review
        const existingReview = await Review.findOne({ user: userId, product: productId });
        if (existingReview) {
            return res.status(400).json({ message: "You have already reviewed this product. Please update your existing review." });
        }

        const newReview = new Review({
            user: userId,
            product: productId,
            rating: Number(rating),
            review: review.trim()
        });

        await newReview.save();
        await updateProductRating(productId);

        res.status(201).json({ message: "Review submitted successfully", review: newReview });
    } catch (error) {
        console.error("Error adding review:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "You have already reviewed this product." });
        }
        res.status(500).json({ message: "Server error submitting review." });
    }
};

exports.updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, review } = req.body;
        const userId = req.user._id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Please provide a valid rating between 1 and 5." });
        }
        if (!review || review.trim().length < 10 || review.trim().length > 500) {
            return res.status(400).json({ message: "Review text must be between 10 and 500 characters." });
        }

        const existingReview = await Review.findOne({ _id: reviewId, user: userId });
        if (!existingReview) {
            return res.status(404).json({ message: "Review not found or unauthorized." });
        }

        existingReview.rating = Number(rating);
        existingReview.review = review.trim();
        await existingReview.save();
        
        await updateProductRating(existingReview.product);

        res.json({ message: "Review updated successfully", review: existingReview });
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ message: "Server error updating review." });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found." });
        }

        // Allow deletion if user owns it OR user is admin
        if (review.user.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized to delete this review." });
        }

        await review.deleteOne();
        await updateProductRating(review.product);

        res.json({ message: "Review deleted successfully" });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ message: "Server error deleting review." });
    }
};
