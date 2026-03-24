const express = require("express");
const router = express.Router();

// Import modular actions from supplier subfolder
const createSupplier = require("../controllers/supplier/createSupplier");
const getSuppliers = require("../controllers/supplier/getSuppliers");
const getSupplierById = require("../controllers/supplier/getSupplierById");
const updateSupplier = require("../controllers/supplier/updateSupplier");
const deleteSupplier = require("../controllers/supplier/deleteSupplier");

router.post("/", createSupplier);
router.get("/", getSuppliers);
router.get("/:id", getSupplierById);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

module.exports = router;