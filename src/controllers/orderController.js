const Order = require("../models/Order");
const User = require("../models/User");

// Get the authenticated user's order history
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Fetch User Data
        const user = await User.findById(userId).select("name email");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2. Fetch User Orders (Newest First)
        // The requirement mentions populating, but we embedded name/image/price in the schema
        // for historical integrity (price at time of purchase). If they were not embedded,
        // we would use: .populate("products.product", "name image price")
        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

        // 3. Return JSON payload
        res.status(200).json({
            success: true,
            user: {
                name: user.name,
                email: user.email,
            },
            orders: orders,
        });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
