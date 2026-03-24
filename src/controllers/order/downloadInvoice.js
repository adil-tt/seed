const Order = require("../../models/Order");
const PDFDocument = require('pdfkit');

/**
 * Download/View Order Invoice (PDFKit)
 */
const downloadInvoice = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.orderId;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const doc = new PDFDocument({ margin: 50 });
    const filename = `invoice_${orderId}.pdf`;

    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // Header
    doc.fillColor('#1e3a8a').fontSize(28).text('CERAMICO', { align: 'right' });
    doc.fillColor('#666666').fontSize(10).text('Your Premium Ceramic Partner', { align: 'right' });
    doc.moveDown(2);

    doc.fillColor('#333333').fontSize(20).text('INVOICE', { align: 'left' });
    doc.moveDown();

    // Billing Details
    const shipping = order.shippingAddress;
    doc.fontSize(10).fillColor('#555555').text('Billed To:', { underline: true });
    doc.fillColor('#000000').text(shipping.fullName);
    doc.text(`${shipping.house}, ${shipping.street}`);
    doc.text(`${shipping.city}, ${shipping.state} - ${shipping.pincode}`);
    doc.text(`Phone: ${shipping.phone}`);
    
    // Order Details
    const currentY = doc.y - 60;
    doc.text(`Order ID: #${order._id.toString().toUpperCase().substring(0, 10)}`, 300, currentY, { align: 'right' });
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-GB')}`, 300, currentY + 15, { align: 'right' });
    doc.text(`Payment: ${order.paymentMethod}`, 300, currentY + 30, { align: 'right' });
    doc.text(`Status: ${order.paymentStatus}`, 300, currentY + 45, { align: 'right' });
    
    doc.moveDown(4);

    // Table Header
    const tableTop = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Item Description', 50, tableTop);
    doc.text('Price', 280, tableTop, { width: 90, align: 'right' });
    doc.text('Qty', 370, tableTop, { width: 90, align: 'right' });
    doc.text('Total', 470, tableTop, { width: 90, align: 'right' });
    
    doc.moveTo(50, tableTop + 15).lineTo(560, tableTop + 15).stroke();
    doc.font('Helvetica');

    let yPosition = tableTop + 25;
    let subtotal = 0;
    let cancelledTotal = 0;

    order.products.forEach(p => {
      const itemTotal = p.price * p.quantity;
      
      if (p.isCancelled) {
        doc.fillColor('#999999');
        cancelledTotal += itemTotal;
        doc.text(`${p.name} (CANCELLED)`, 50, yPosition);
      } else {
        doc.fillColor('#333333');
        subtotal += itemTotal;
        doc.text(p.name, 50, yPosition);
      }

      doc.text(`Rs. ${p.price.toFixed(2)}`, 280, yPosition, { width: 90, align: 'right' });
      doc.text(p.quantity.toString(), 370, yPosition, { width: 90, align: 'right' });
      doc.text(`Rs. ${itemTotal.toFixed(2)}`, 470, yPosition, { width: 90, align: 'right' });
      
      yPosition += 20;
    });

    doc.moveTo(50, yPosition + 10).lineTo(560, yPosition + 10).stroke();
    yPosition += 20;

    // Totals
    doc.fillColor('#555555');
    doc.text('Subtotal:', 370, yPosition, { width: 90, align: 'right' });
    doc.text(`Rs. ${(subtotal + cancelledTotal).toFixed(2)}`, 470, yPosition, { width: 90, align: 'right' });
    yPosition += 15;

    if (cancelledTotal > 0) {
      doc.fillColor('#ef4444');
      doc.text('Cancelled Adjustments:', 280, yPosition, { width: 180, align: 'right' });
      doc.text(`-Rs. ${cancelledTotal.toFixed(2)}`, 470, yPosition, { width: 90, align: 'right' });
      yPosition += 15;
    }

    doc.font('Helvetica-Bold').fillColor('#1e3a8a');
    doc.text('Total Amount:', 370, yPosition, { width: 90, align: 'right' });
    doc.text(`Rs. ${order.totalAmount.toFixed(2)}`, 470, yPosition, { width: 90, align: 'right' });
    
    doc.moveDown(4);
    doc.font('Helvetica').fillColor('#888888').fontSize(10).text('Thank you for shopping with Ceramico! If you have any questions, contact support@ceramico.com.', 50, doc.y, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error("DOWNLOAD INVOICE ERROR:", error);
    next(error);
  }
};

module.exports = downloadInvoice;
