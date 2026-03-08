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
