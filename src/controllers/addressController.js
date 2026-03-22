const User = require("../models/User");

// Add a new address to the user's addresses array
exports.addAddress = async (req, res) => {
    try {
        if (req.validationErrors) {
            return res.status(400).json({
                message: "Validation Failed",
                errors: req.validationErrors
            });
        }

        const userId = req.user.id;
        const {
            fullName,
            phone,
            house,
            street,
            landmark,
            city,
            state,
            pincode,
            isDefault
        } = req.body;

        // Optional validation logic here if required by the system,
        // though Mongoose will also enforce required schema fields

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // If this is the user's first address, make it default automatically
        let useAsDefault = isDefault || false;
        if (user.addresses.length === 0) {
            useAsDefault = true;
        }

        // If new address is set as default, unset other defaults
        if (useAsDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            });
        }

        const newAddress = {
            fullName,
            phone,
            house,
            street,
            landmark,
            city,
            state,
            pincode,
            isDefault: useAsDefault,
        };

        user.addresses.push(newAddress);
        await user.save();

        res.status(201).json({
            message: "Address added successfully",
            addresses: user.addresses
        });

    } catch (error) {
        console.error("Error adding address:", error);
        res.status(500).json({ message: "Server error preventing address creation", error: error.message });
    }
};

// Get all the authenticated user's saved addresses
exports.getUserAddresses = async (req, res) => {
    try {
        const userId = req.user.id;

        // Using simple projection to just grab the addresses, or grab the whole user object
        const user = await User.findById(userId).select("addresses");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            addresses: user.addresses
        });

    } catch (error) {
        console.error("Error fetching addresses:", error);
        res.status(500).json({ message: "Server error during fetch", error: error.message });
    }
};

// Set an address as default
exports.setDefaultAddress = async (req, res) => {
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
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Delete an address
exports.deleteAddress = async (req, res) => {
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
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

