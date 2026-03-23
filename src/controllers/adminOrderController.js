const Order = require("../models/Order");

// @desc    Get all orders for admin with pagination, search, and stats
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const statusFilter = req.query.status || '';
        const search = req.query.search || '';

        // Build base query
        let query = {};

        // Filter by status if provided (All, Completed, Pending, Canceled)
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

        // Search by order ID
        if (search) {
            // Need to support matching ObjectIDs or short order IDs if we stored them
            // Right now we just have _id, so we'll strictly search if it matches hex
            if (search.startsWith('#ORD')) {
                // We will need to decide how to search, for now, let's keep it simple
            }
        }

        // Fetch Orders with pagination
        const totalOrdersFiltered = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalOrdersFiltered / limit);

        const orders = await Order.find(query)
            .populate('user', 'name email') // Get user info
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Fetch Stats
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
        console.error("Error fetching admin orders:", error);
        res.status(500).json({ success: false, message: "Server Error fetching orders" });
    }
};

// @desc    Update delivery status of an order
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { deliveryStatus } = req.body;

        const validStatuses = ["Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Returned"];

        if (!validStatuses.includes(deliveryStatus)) {
            return res.status(400).json({ success: false, message: "Invalid delivery status" });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        order.deliveryStatus = deliveryStatus;

        // If delivered, we might also want to mark payment as completed if it was COD
        if (deliveryStatus === 'Delivered' && order.paymentMethod === 'COD' && order.paymentStatus === 'Pending') {
            order.paymentStatus = 'Completed';
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: `Order status updated to ${deliveryStatus}`,
            order
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Server Error updating order" });
    }
};

// @desc    Export orders to CSV
// @route   GET /api/admin/orders/export
// @access  Private/Admin
const exportOrdersExcel = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const orders = await Order.find(query).populate('user', 'name email').sort({ createdAt: -1 });

        // Generate CSV string
        let csv = 'Order ID,Customer Name,Customer Email,Date,Total Amount,Payment Method,Payment Status,Delivery Status\n';
        
        orders.forEach(order => {
            const customerName = order.user && order.user.name ? `"${order.user.name.replace(/"/g, '""')}"` : 'Unknown';
            const customerEmail = order.user && order.user.email ? `"${order.user.email.replace(/"/g, '""')}"` : 'Unknown';
            const date = new Date(order.createdAt).toLocaleDateString() + ' ' + new Date(order.createdAt).toLocaleTimeString();
            const total = order.totalAmount.toFixed(2);
            
            csv += `"${order._id}",${customerName},${customerEmail},"${date}",${total},"${order.paymentMethod || 'N/A'}","${order.paymentStatus || 'Pending'}","${order.deliveryStatus || 'Pending'}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.csv');
        res.status(200).send(csv);

    } catch (error) {
        console.error("Export Error:", error);
        res.status(500).json({ success: false, message: "Server Error during export" });
    }
};

module.exports = {
    getAllOrders,
    updateOrderStatus,
    exportOrdersExcel
};
