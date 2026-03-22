const Order = require("../models/Order");
const User = require("../models/User");
const PDFDocument = require('pdfkit');

// Get the authenticated user's order history
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Fetch User Data
        const user = await User.findById(userId).select("name email");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

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

// Create a new order from Cart
exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { addressId, paymentMethod, totalAmount } = req.body;

        if (!addressId || !paymentMethod || !totalAmount) {
            return res.status(400).json({ success: false, message: "Missing required order fields" });
        }

        // 1. Fetch User with populated Cart and verify address exists
        const user = await User.findById(userId).populate('cart.product');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const selectedAddress = user.addresses.id(addressId);
        if (!selectedAddress) {
            return res.status(404).json({ success: false, message: "Selected address not found in user profile" });
        }

        // 2. Validate Cart
        // Filter out any cart items where the product might have been deleted from DB (null)
        const validCartItems = user.cart.filter(item => item.product != null);

        if (!validCartItems || validCartItems.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty or contains deleted products" });
        }

        // Validate stock for all items BEFORE creating order
        for (const item of validCartItems) {
            if (item.quantity > item.product.stock) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${item.product.name}. Only ${item.product.stock} left.` });
            }
        }

        // 3. Map Cart Items to Order Products Array format
        const orderProducts = validCartItems.map(item => ({
            product: item.product._id,
            name: item.product.name,
            image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : "",
            price: item.product.price,
            quantity: item.quantity
        }));

        // 4. Create internal Order
        const newOrder = new Order({
            user: userId,
            products: orderProducts,
            totalAmount: totalAmount,
            shippingAddress: {
                fullName: selectedAddress.fullName,
                phone: selectedAddress.phone,
                house: selectedAddress.house,
                street: selectedAddress.street,
                landmark: selectedAddress.landmark || "",
                city: selectedAddress.city,
                state: selectedAddress.state,
                pincode: selectedAddress.pincode
            },
            paymentMethod: paymentMethod === 'razorpay' ? 'Razorpay' : (paymentMethod === 'wallet' ? 'Wallet' : 'COD'),
            paymentStatus: paymentMethod === 'cod' ? 'Pending' : 'Pending', // Razorpay starts Pending until verify
            deliveryStatus: 'Processing'
        });

        await newOrder.save();

        // 4b. Decrement stock for ordered items
        for (const item of validCartItems) {
            item.product.stock -= item.quantity;
            await item.product.save();
        }

        // 5. Clear User's Cart only if not Razorpay
        // For Razorpay, we will clear the cart when the payment is verified successfully
        if (paymentMethod !== 'razorpay') {
            user.cart = [];
            await user.save();
        }

        res.status(201).json({ success: true, message: "Order created successfully", order: newOrder });

    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Cancel a single item from an order
exports.cancelOrderItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId, productId } = req.params;

        // Find the order
        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Only allow if order is still Processing
        if (order.deliveryStatus !== "Processing") {
            return res.status(400).json({ success: false, message: "Cannot cancel item. Order is already processed." });
        }

        // Find the product in the order
        const productItem = order.products.find(item => item.product.toString() === productId);
        if (!productItem) {
            return res.status(404).json({ success: false, message: "Product not found in this order" });
        }

        if (productItem.isCancelled) {
            return res.status(400).json({ success: false, message: "Product is already cancelled" });
        }

        // Mark as cancelled
        productItem.isCancelled = true;

        // Refund the product amount
        const refundAmount = productItem.price * productItem.quantity;
        order.totalAmount -= refundAmount;

        // Check if all items are cancelled
        const allCancelled = order.products.every(item => item.isCancelled);
        if (allCancelled) {
            order.deliveryStatus = "Cancelled";
            order.paymentStatus = order.paymentMethod === "COD" ? "Cancelled" : "Refunded";
        }

        await order.save();

        // Restore stock
        const Product = require("../models/Product");
        const productDoc = await Product.findById(productId);
        if (productDoc) {
            productDoc.stock += productItem.quantity;
            await productDoc.save();
        }

        res.status(200).json({ success: true, message: "Item cancelled successfully", order });

    } catch (error) {
        console.error("Error cancelling order item:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Cancel an entire order
exports.cancelOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId } = req.params;

        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        if (order.deliveryStatus !== "Processing") {
            return res.status(400).json({ success: false, message: "Only processing orders can be cancelled." });
        }

        // Cancel all products
        let refundAmount = 0;
        const Product = require("../models/Product");

        for (const item of order.products) {
            if (!item.isCancelled) {
                item.isCancelled = true;
                refundAmount += (item.price * item.quantity);
                
                // Restore stock
                const productDoc = await Product.findById(item.product);
                if (productDoc) {
                    productDoc.stock += item.quantity;
                    await productDoc.save();
                }
            }
        }

        order.totalAmount -= refundAmount;
        order.deliveryStatus = "Cancelled";
        order.paymentStatus = (order.paymentMethod === "COD") ? "Cancelled" : "Refunded";

        await order.save();
        res.status(200).json({ success: true, message: "Order cancelled successfully", order });

    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Return an entire order
exports.returnOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId } = req.params;
        const { reason, details } = req.body;

        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        if (order.deliveryStatus !== "Delivered") {
            return res.status(400).json({ success: false, message: "Only delivered orders can be returned." });
        }

        order.deliveryStatus = "Returned";
        order.paymentStatus = "Refunded"; 
        order.returnReason = reason || "Not Specified";
        order.returnDetails = details || "";

        // Restore stock
        const Product = require("../models/Product");
        for (const item of order.products) {
            if (!item.isCancelled) {
                item.isCancelled = true;
                const productDoc = await Product.findById(item.product);
                if (productDoc) {
                    productDoc.stock += item.quantity;
                    await productDoc.save();
                }
            }
        }

        // Refund to Wallet
        const user = await User.findById(userId);
        if (user) {
            user.walletBalance = (user.walletBalance || 0) + order.totalAmount;
            user.walletTransactions.push({
                amount: order.totalAmount,
                type: 'credit',
                description: `Refund for returned order #${order._id.toString().substring(0, 8).toUpperCase()}`
            });
            await user.save();
        }

        await order.save();
        res.status(200).json({ success: true, message: "Order returned successfully, amount credited to wallet.", order });

    } catch (error) {
        console.error("Error returning order:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Download/View Order Invoice (PDFKit)
exports.downloadInvoice = async (req, res) => {
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
        console.error("Error generating invoice:", error);
        res.status(500).json({ success: false, message: "Error generating PDF invoice" });
    }
};
