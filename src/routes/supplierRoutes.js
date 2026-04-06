const express = require("express");
const router = express.Router();
const  protect  = require("../middleware/authMiddleware");
const  admin  = require("../middleware/adminMiddleware");

// Import modular actions from supplier subfolder
const createSupplier = require("../controllers/supplier/createSupplier");
const getSuppliers = require("../controllers/supplier/getSuppliers");
const getSupplierById = require("../controllers/supplier/getSupplierById");
const updateSupplier = require("../controllers/supplier/updateSupplier");
const deleteSupplier = require("../controllers/supplier/deleteSupplier");

router.post("/", protect, admin, createSupplier);
router.get("/", getSuppliers);
router.get("/:id", getSupplierById);
router.put("/:id", protect, admin, updateSupplier);
router.delete("/:id", protect, admin, deleteSupplier);

module.exports = router;