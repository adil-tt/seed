const express = require("express");
const router = express.Router();

// Import modular actions from purchase subfolder
const createPurchase = require("../controllers/purchase/createPurchase");
const getPurchases = require("../controllers/purchase/getPurchases");

const getPurchaseById = require("../controllers/purchase/getPurchaseById");
const updatePurchase = require("../controllers/purchase/updatePurchase");

router.post("/", createPurchase);
router.get("/", getPurchases);
router.get("/:id", getPurchaseById);
router.put("/:id", updatePurchase);

module.exports = router;