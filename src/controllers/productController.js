const Product = require("../models/Product");

exports.createProduct = async (req, res) => {
    try {
        console.log("Incoming data:", req.body);
        console.log("Uploaded files:", req.files);

        const { product_name, name, ...otherDetails } = req.body;

        const product = new Product({
            name: name || product_name,
            ...otherDetails,
            images: req.files ? req.files.map(file => file.filename) : []
        });

        await product.save();

        res.status(201).json({
            message: "Product created successfully",
            product
        });

    } catch (error) {
        console.error("🔥 ERROR:", error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find().populate("category").sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate("category");
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { product_name, name, ...otherDetails } = req.body;
        const updateData = {
            name: name || product_name,
            ...otherDetails
        };

        if (req.files && req.files.length > 0) {
            updateData.images = req.files.map(file => file.filename);
        }

        const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!product) return res.status(404).json({ message: "Product not found" });

        res.json({ message: "Product updated successfully", product });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};