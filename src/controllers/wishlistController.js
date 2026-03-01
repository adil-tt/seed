const User = require("../models/User");
const Product = require("../models/Product");

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'wishlist.product',
            populate: { path: 'category', select: 'name' }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user.wishlist);
    } catch (error) {
        console.error("Error in getWishlist:", error);
        res.status(500).json({ message: "Server Error fetching wishlist" });
    }
};

// @desc    Add item to wishlist
// @route   POST /api/wishlist/add
// @access  Private
const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ message: "Product ID is required" });
        }

        // Verify product exists
        const productExists = await Product.findById(productId);
        if (!productExists) {
            return res.status(404).json({ message: "Product not found" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if product already in wishlist
        const exists = user.wishlist.some((item) => {
            const currentId = item.product && item.product._id ? item.product._id.toString() : item.product?.toString();
            return currentId === productId.toString();
        });

        if (exists) {
            return res.status(400).json({ message: "Product already in wishlist" });
        }

        console.log(`Adding Product ${productId} to user ${user.email} wishlist...`);
        user.wishlist.push({ product: productId });
        await user.save();
        console.log(`Saved. New wishlist length: ${user.wishlist.length}`);

        res.status(200).json({ message: "Item added to wishlist", wishlist: user.wishlist });
    } catch (error) {
        console.error("Error in addToWishlist:", error);
        res.status(500).json({ message: "Server Error adding to wishlist" });
    }
};

// @desc    Remove item from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const initialLength = user.wishlist.length;
        user.wishlist = user.wishlist.filter(
            (item) => item.product.toString() !== productId
        );

        if (user.wishlist.length === initialLength) {
            return res.status(404).json({ message: "Item not found in wishlist" });
        }

        await user.save();

        res.status(200).json({ message: "Item removed from wishlist", wishlist: user.wishlist });
    } catch (error) {
        console.error("Error in removeFromWishlist:", error);
        res.status(500).json({ message: "Server Error removing from wishlist" });
    }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
};
