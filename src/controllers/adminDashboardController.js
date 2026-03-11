const Order = require("../models/Order");
const Product = require("../models/Product");

// @desc    Get dashboard statistics, recent transactions, and top products
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        // 1. Fetch overall metrics
        const totalOrdersCount = await Order.countDocuments();

        // Sum total amount (excluding cancelled)
        const salesAggregation = await Order.aggregate([
            { $match: { deliveryStatus: { $ne: "Cancelled" } } },
            { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }
        ]);
        const totalSales = salesAggregation.length > 0 ? salesAggregation[0].totalSales : 0;

        // Pending and Cancelled Orders
        const pendingCount = await Order.countDocuments({ deliveryStatus: { $in: ["Processing", "Pending"] } });
        const canceledCount = await Order.countDocuments({ deliveryStatus: "Cancelled" });

        // 2. Fetch Recent Transactions (limit 4)
        const recentTransactions = await Order.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .limit(4);

        // 3. Fetch Top Selling Products
        const topProductsAggregation = await Order.aggregate([
            { $unwind: "$products" },
            // Optional: match only non-cancelled orders to count true sales
            { $match: { deliveryStatus: { $ne: "Cancelled" } } },
            {
                $group: {
                    _id: "$products.product",
                    totalSold: { $sum: "$products.quantity" },
                    name: { $first: "$products.name" },
                    image: { $first: "$products.image" },
                    price: { $first: "$products.price" }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 3 }
        ]);

        res.status(200).json({
            success: true,
            metrics: {
                totalSales,
                totalOrders: totalOrdersCount,
                pending: pendingCount,
                canceled: canceledCount
            },
            recentTransactions,
            topProducts: topProductsAggregation
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ success: false, message: "Server Error fetching dashboard stats" });
    }
};

module.exports = {
    getDashboardStats
};
