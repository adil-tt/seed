const User = require("../../models/User");

/**
 * Set an address as default
 */
const setDefaultAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the address
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Unset all defaults
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });

    // Set the requested one as default
    address.isDefault = true;

    await user.save();

    res.status(200).json({
      message: "Default address updated successfully",
      addresses: user.addresses
    });

  } catch (error) {
    console.error("Error setting default address:", error);
    next(error);
  }
};

module.exports = setDefaultAddress;
