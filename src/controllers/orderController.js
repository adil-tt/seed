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

// Download/View Order Invoice
exports.downloadInvoice = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.orderId;

        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) {
            return res.status(404).send("Order not found");
        }

        // Simple HTML invoice wrapper that auto-prints
        let tbody = '';
        order.products.forEach(p => {
            const trClass = p.isCancelled ? 'cancelled text-muted' : '';
            const badge = p.isCancelled ? '<span class="badge">CANCELLED</span>' : '';
            tbody += '<tr class="' + trClass + '">';
            tbody += '<td><strong>' + p.name + '</strong> ' + badge + '</td>';
            tbody += '<td>₹' + p.price.toFixed(2) + '</td>';
            tbody += '<td>' + p.quantity + '</td>';
            tbody += '<td style="text-align: right;">₹' + (p.price * p.quantity).toFixed(2) + '</td>';
            tbody += '</tr>';
        });

        const subtotal = order.products.reduce((acc, p) => acc + (p.price * p.quantity), 0).toFixed(2);
        const hasCancelled = order.products.some(p => p.isCancelled);
        const cancelledTotal = order.products.filter(p => p.isCancelled).reduce((acc, p) => acc + (p.price * p.quantity), 0).toFixed(2);
        const cancelledHtml = hasCancelled ? '<div class="totals-row" style="color: #ef4444;"><span>Cancelled Adjustments:</span><span>-₹' + cancelledTotal + '</span></div>' : '';

        const html = [
            '<!DOCTYPE html>',
            '<html>',
            '<head>',
            '    <title>Invoice #' + order._id + '</title>',
            '    <style>',
            '        body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }',
            '        .header { border-bottom: 2px solid #ddd; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }',
            '        .logo { font-size: 28px; font-weight: bold; color: #1e3a8a; letter-spacing: 2px; }',
            '        .invoice-title { font-size: 32px; color: #666; letter-spacing: 4px; }',
            '        .details { display: flex; justify-content: space-between; margin-top: 30px; margin-bottom: 40px; }',
            '        .section-title { font-weight: bold; margin-bottom: 10px; color: #555; text-transform: uppercase; font-size: 14px; }',
            '        table { width: 100%; border-collapse: collapse; margin-top: 20px; }',
            '        th, td { padding: 15px 12px; text-align: left; border-bottom: 1px solid #ddd; }',
            '        th { background-color: #f8f9fa; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; color: #555; }',
            '        .totals { float: right; width: 300px; margin-top: 30px; }',
            '        .totals-row { display: flex; justify-content: space-between; padding: 10px 0; }',
            '        .totals-row.grand-total { font-weight: bold; font-size: 20px; border-top: 2px solid #333; padding-top: 15px; color: #1e3a8a; }',
            '        .cancelled { background-color: #fafafa; }',
            '        .cancelled td { text-decoration: line-through; color: #999; }',
            '        .badge { background: #fee2e2; color: #ef4444; padding: 4px 8px; font-size: 12px; border-radius: 4px; border: 1px solid #fca5a5; display: inline-block; margin-left: 10px;}',
            '    </style>',
            '</head>',
            '<body onload="window.print()">',
            '    <div class="header">',
            '        <div>',
            '            <div class="logo">CERAMICO</div>',
            '            <div style="color: #666; margin-top: 10px;">Your Premium Ceramic Partner</div>',
            '        </div>',
            '        <div class="invoice-title">INVOICE</div>',
            '    </div>',
            '    <div class="details">',
            '        <div>',
            '            <div class="section-title">Billed To</div>',
            '            <div><strong>' + order.shippingAddress.fullName + '</strong></div>',
            '            <div style="margin-top: 4px;">' + order.shippingAddress.house + ', ' + order.shippingAddress.street + '</div>',
            '            <div>' + order.shippingAddress.city + ', ' + order.shippingAddress.state + ' - ' + order.shippingAddress.pincode + '</div>',
            '            <div style="margin-top: 4px;">Phone: ' + order.shippingAddress.phone + '</div>',
            '        </div>',
            '        <div style="text-align: right;">',
            '            <br>',
            '            <div><strong>Order ID:</strong> #' + order._id.toString().toUpperCase().substring(0, 10) + '</div>',
            '            <div style="margin-top: 4px;"><strong>Date:</strong> ' + new Date(order.createdAt).toLocaleDateString('en-GB') + '</div>',
            '            <div style="margin-top: 4px;"><strong>Payment Method:</strong> ' + order.paymentMethod + '</div>',
            '            <div style="margin-top: 4px;"><strong>Payment Status:</strong> ' + order.paymentStatus + '</div>',
            '        </div>',
            '    </div>',
            '    ',
            '    <table>',
            '        <thead>',
            '            <tr>',
            '                <th>Item Description</th>',
            '                <th>Price</th>',
            '                <th>Qty</th>',
            '                <th style="text-align: right;">Total</th>',
            '            </tr>',
            '        </thead>',
            '        <tbody>',
            tbody,
            '        </tbody>',
            '    </table>',
            '    ',
            '    <div class="totals">',
            '        <div class="totals-row">',
            '            <span>Subtotal:</span>',
            '            <span>₹' + subtotal + '</span>',
            '        </div>',
            cancelledHtml,
            '        <div class="totals-row grand-total">',
            '            <span>Total Amount:</span>',
            '            <span>₹' + order.totalAmount.toFixed(2) + '</span>',
            '        </div>',
            '    </div>',
            '    ',
            '    <div style="margin-top: 100px; text-align: center; color: #888; border-top: 1px dashed #ddd; padding-top: 20px;">',
            '        Thank you for shopping with Ceramico! If you have any questions, contact support@ceramico.com.',
            '    </div>',
            '</body>',
            '</html>'
        ].join('\n');

        res.send(html);

    } catch (error) {
        console.error("Error generating invoice:", error);
        res.status(500).send("Error generating invoice");
    }
};
