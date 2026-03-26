const User = require("../../models/User");
const Order = require("../../models/Order");

/**
 * Get all users for admin dashboard (with pagination & search)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || '';

    let query = { role: { $ne: 'admin' } };

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const userIds = users.map(u => u._id);
    const allOrders = await Order.find({ user: { $in: userIds } });

    const formattedUsers = users.map(user => {
      let status = 'Pending';
      if (user.isBlocked) status = 'Blocked';
      else if (user.isVerified) status = 'Active';

      const userOrders = allOrders.filter(o => o.user.toString() === user._id.toString());
      const orderCount = userOrders.length;
      const totalSpend = userOrders.reduce((sum, order) => {
        if (order.deliveryStatus !== 'Cancelled' && order.deliveryStatus !== 'Returned') {
          return sum + (order.totalAmount || 0);
        }
        return sum;
      }, 0);
      return {
        _id: user._id,
        firstName: user.firstName || user.name,
        lastName: user.lastName || '',
        email: user.email,
        phone: user.phone || 'N/A',
        createdAt: user.createdAt,
        status: status,
        isBlocked: user.isBlocked,
        orderCount: orderCount,
        totalSpend: totalSpend
      };
    });

    // Summary Stats
    const totalCount = await User.countDocuments({ role: { $ne: 'admin' } });
    const activeCount = await User.countDocuments({ role: { $ne: 'admin' }, isVerified: true, isBlocked: false });
    const newCount = await User.countDocuments({ 
        role: { $ne: 'admin' }, 
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
    });

    // Weekly Registrations Aggregation (for the chart)
    const weeklyRegAggregation = await User.aggregate([
        { $match: { role: { $ne: 'admin' } } },
        { $group: { _id: { $dayOfWeek: "$createdAt" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);

    const weeklyRegistrations = new Array(7).fill(0);
    weeklyRegAggregation.forEach(item => {
        weeklyRegistrations[item._id - 1] = item.count;
    });

    res.status(200).json({
      success: true,
      users: formattedUsers,
      summary: {
        total: totalCount,
        active: activeCount,
        new: newCount,
        weeklyRegistrations
      },
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error("GET ALL USERS ADMIN ERROR:", error);
    next(error);
  }
};

module.exports = getAllUsers;
