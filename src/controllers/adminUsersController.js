const User = require("../models/User");

// @desc    Get all users for admin dashboard (with pagination & search)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search || '';

        // Build query object
        let query = { role: { $ne: 'admin' } }; // Optionally exclude admins from customer list

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

        // Map data to match exactly what the frontend table expects
        const Order = require("../models/Order");
        const userIds = users.map(u => u._id);
        const allOrders = await Order.find({ user: { $in: userIds } });

        const formattedUsers = users.map(user => {
            let status = 'Pending';
            if (user.isBlocked) status = 'Blocked';
            else if (user.isVerified) status = 'Active';

            // Calculate Order Stats
            const userOrders = allOrders.filter(o => o.user.toString() === user._id.toString());
            const orderCount = userOrders.length;
            const totalSpend = userOrders.reduce((sum, order) => {
                // Sum only if not cancelled or returned
                if (order.deliveryStatus !== 'Cancelled' && order.deliveryStatus !== 'Returned') {
                    return sum + (order.totalAmount || 0);
                }
                return sum;
            }, 0);

            return {
                _id: user._id,
                firstName: user.firstName || user.name, // Fallback to name if firstName is empty
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

        res.status(200).json({
            success: true,
            users: formattedUsers,
            pagination: {
                totalUsers,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.error("Error fetching users for admin:", error);
        res.status(500).json({ success: false, message: "Server Error fetching users" });
    }
};

// @desc    Toggle block status of a user
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
const toggleBlockUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ success: false, message: "Cannot block an admin user" });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User successfully ${user.isBlocked ? 'blocked' : 'unblocked'}`,
            isBlocked: user.isBlocked
        });
    } catch (error) {
        console.error("Error toggling block status:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ success: false, message: "Cannot delete an admin user" });
        }

        await User.findByIdAndDelete(userId);

        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get detailed user info including orders summary
// @route   GET /api/admin/users/:id/details
// @access  Private/Admin
const getUserDetails = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select("-password -otp -otpExpiry");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const Order = require("../models/Order");

        // Fetch completed, total, canceled orders
        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
        
        const totalOrders = orders.length;
        const completedOrders = orders.filter(o => o.deliveryStatus === 'Delivered').length;
        const canceledOrders = orders.filter(o => o.deliveryStatus === 'Cancelled' || o.deliveryStatus === 'Returned').length;

        // Last purchase date
        let lastPurchaseDate = null;
        if (orders.length > 0) {
            lastPurchaseDate = orders[0].createdAt;
        }

        res.status(200).json({
            success: true,
            user,
            stats: {
                totalOrders,
                completedOrders,
                canceledOrders,
                lastPurchaseDate
            }
        });
    } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    getAllUsers,
    toggleBlockUser,
    deleteUser,
    getUserDetails
};
