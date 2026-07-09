const Order = require("../../models/Order");

/**
 * Get all orders for admin with pagination, search, and stats
 */
const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status || '';
    const search = req.query.search || '';

    let query = {};

    if (statusFilter && statusFilter !== 'All') {
      if (statusFilter === 'Completed') {
        query.deliveryStatus = 'Delivered';
      } else if (statusFilter === 'Pending') {
        query.deliveryStatus = { $in: ['Processing', 'Pending'] };
      } else if (statusFilter === 'Canceled') {
        query.deliveryStatus = 'Cancelled';
      } else {
        query.deliveryStatus = statusFilter;
      }
    }

    if (search) {
      query.$or = [
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } }
      ];
      
      const regexMatchArg = search.replace(/^#?ORD-/i, '');
      if (regexMatchArg) {
          query.$or.push({
            $expr: {
              $regexMatch: {
                input: { $toString: '$_id' },
                regex: regexMatchArg,
                options: 'i'
              }
            }
          });
      }
    }

    if (req.query.date) {
      const selectedDate = new Date(req.query.date);
      if (!isNaN(selectedDate.getTime())) {
        const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
        query.createdAt = {
          $gte: startOfDay,
          $lte: endOfDay
        };
      }
    }

    const totalOrdersFiltered = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrdersFiltered / limit);

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    const [totalCount, newCount, completedCount, canceledCount] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Order.countDocuments({ deliveryStatus: 'Delivered' }),
      Order.countDocuments({ deliveryStatus: 'Cancelled' })
    ]);

    const revenueAggregation = await Order.aggregate([
      { $match: { paymentStatus: 'Completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalOrders: totalCount,
        newOrders: newCount,
        completedOrders: completedCount,
        canceledOrders: canceledCount,
        totalRevenue: totalRevenue
      },
      orders: orders,
      pagination: {
        totalOrders: totalOrdersFiltered,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error("GET ALL ORDERS ADMIN ERROR:", error);
    next(error);
  }
};

module.exports = getAllOrders;
