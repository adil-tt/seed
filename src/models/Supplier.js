const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
    supplier_name: {
        type: String,
        required: true,
        trim: true
    },
    contact_person: String,
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: String,
    city: String,
    zip_code: String,
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    }
}, { timestamps: true });

module.exports = mongoose.model("Supplier", supplierSchema);