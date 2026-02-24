const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
    supplier_name: String,
    company_name: String,
    contact_person: String,
    tax_id: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    zip_code: String,
    country: String,
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    }
}, { timestamps: true });

module.exports = mongoose.model("Supplier", supplierSchema);