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
