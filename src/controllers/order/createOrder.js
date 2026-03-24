const Order = require("../../models/Order");
const User = require("../../models/User");

/**
 * Create a new order from Cart
 */
const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId, paymentMethod, totalAmount, couponCode, discountAmount } = req.body;

    if (!addressId || !paymentMethod || !totalAmount) {
      return res.status(400).json({ success: false, message: "Missing required order fields" });
    }

    const user = await User.findById(userId).populate('cart.product');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const selectedAddress = user.addresses.id(addressId);
    if (!selectedAddress) {
      return res.status(404).json({ success: false, message: "Selected address not found in user profile" });
    }

    const validCartItems = user.cart.filter(item => item.product != null);
    if (!validCartItems || validCartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty or contains deleted products" });
    }

    for (const item of validCartItems) {
      if (item.quantity > item.product.stock) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${item.product.name}. Only ${item.product.stock} left.` });
      }
    }

    const orderProducts = validCartItems.map(item => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : "",
      price: item.product.price,
      quantity: item.quantity
    }));

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
      paymentStatus: 'Pending',
      deliveryStatus: 'Processing',
      couponCode: couponCode || null,
      discountAmount: discountAmount || 0
    });

    await newOrder.save();

    if (couponCode) {
      const Coupon = require("../../models/Coupon");
      await Coupon.findOneAndUpdate(
        { code: couponCode.toUpperCase() },
        { $inc: { usedCount: 1 } }
      ).catch(err => console.error("Error updating coupon usedCount:", err));
    }

    for (const item of validCartItems) {
      item.product.stock -= item.quantity;
      await item.product.save();
    }

    if (paymentMethod !== 'razorpay') {
      user.cart = [];
      await user.save();
    }

    res.status(201).json({ success: true, message: "Order created successfully", order: newOrder });

  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    next(error);
  }
};

module.exports = createOrder;
