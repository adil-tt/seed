const User = require("../../models/User");

/**
 * Delete an address
 */
const deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Use standard approach for subdocuments
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    user.addresses.splice(addressIndex, 1);
    await user.save();

    res.status(200).json({
      message: "Address deleted successfully",
      addresses: user.addresses
    });

  } catch (error) {
    console.error("Error deleting address:", error);
    next(error);
  }
};

module.exports = deleteAddress;
