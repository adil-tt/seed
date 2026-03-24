const Order = require("../../models/Order");

/**
 * Export orders to CSV (Admin)
 */
const exportOrdersExcel = async (req, res, next) => {
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
    console.error("EXPORT ORDERS ERROR:", error);
    next(error);
  }
};

module.exports = exportOrdersExcel;
