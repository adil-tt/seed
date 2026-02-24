const Supplier = require("../models/Supplier");

exports.createSupplier = async (req, res) => {
    try {
        const supplier = new Supplier(req.body);
        await supplier.save();
        res.status(201).json({ message: "Supplier created", supplier });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};