const express = require("express");
const router = express.Router();
const  protect  = require("../middleware/authMiddleware");
const  admin  = require("../middleware/adminMiddleware");

// Import modular actions from purchase subfolder
const createPurchase = require("../controllers/purchase/createPurchase");
const getPurchases = require("../controllers/purchase/getPurchases");

const getPurchaseById = require("../controllers/purchase/getPurchaseById");
const updatePurchase = require("../controllers/purchase/updatePurchase");

router.post("/", protect, admin, createPurchase);
router.get("/", protect, admin, getPurchases);
router.get("/:id", protect, admin, getPurchaseById);
router.put("/:id", protect, admin, updatePurchase);

module.exports = router;