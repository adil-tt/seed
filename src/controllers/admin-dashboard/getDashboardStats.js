const Order = require("../../models/Order");

/**
 * Get dashboard statistics, recent transactions, and top products (Admin)
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const totalOrdersCount = await Order.countDocuments();

    const salesAggregation = await Order.aggregate([
      { $match: { deliveryStatus: { $ne: "Cancelled" } } },
      { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }
    ]);
    const totalSales = salesAggregation.length > 0 ? salesAggregation[0].totalSales : 0;

    const pendingCount = await Order.countDocuments({ deliveryStatus: { $in: ["Processing", "Pending"] } });
    const canceledCount = await Order.countDocuments({ deliveryStatus: "Cancelled" });

    const recentTransactions = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(4);

    const topProductsAggregation = await Order.aggregate([
      { $unwind: "$products" },
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
    console.error("GET DASHBOARD STATS ERROR:", error);
    next(error);
  }
};

module.exports = getDashboardStats;
