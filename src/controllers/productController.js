const Product = require("../models/Product");

exports.createProduct = async (req, res) => {
    try {
        console.log("Incoming data:", req.body);
        console.log("Uploaded file:", req.file);

        const product = new Product({
            ...req.body,
            image: req.file ? req.file.filename : null
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
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};