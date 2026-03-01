const User = require("../models/User");
const Product = require("../models/Product");

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate("cart.product");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user.cart);
    } catch (error) {
        console.error("Error in getCart:", error);
        res.status(500).json({ message: "Server Error fetching cart" });
    }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

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

        // Check if product already in cart
        const existingCartItemIndex = user.cart.findIndex(
            (item) => item.product.toString() === productId
        );

        if (existingCartItemIndex > -1) {
            // Product exists, update quantity
            user.cart[existingCartItemIndex].quantity += Number(quantity);
        } else {
            // New product, add to cart array
            user.cart.push({ product: productId, quantity: Number(quantity) });
        }

        await user.save();

        res.status(200).json({ message: "Item added to cart", cart: user.cart });
    } catch (error) {
        console.error("Error in addToCart:", error);
        res.status(500).json({ message: "Server Error adding to cart" });
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update/:productId
// @access  Private
const updateCartQuantity = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ message: "Valid quantity is required" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const cartItem = user.cart.find((item) => item.product.toString() === productId);

        if (!cartItem) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        cartItem.quantity = Number(quantity);
        await user.save();

        res.status(200).json({ message: "Cart updated", cart: user.cart });
    } catch (error) {
        console.error("Error in updateCartQuantity:", error);
        res.status(500).json({ message: "Server Error updating cart" });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Filter out the product to remove
        const initialCartLength = user.cart.length;
        user.cart = user.cart.filter((item) => item.product.toString() !== productId);

        if (user.cart.length === initialCartLength) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        await user.save();

        res.status(200).json({ message: "Item removed from cart", cart: user.cart });
    } catch (error) {
        console.error("Error in removeFromCart:", error);
        res.status(500).json({ message: "Server Error removing from cart" });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
};
