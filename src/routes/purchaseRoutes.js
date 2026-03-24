const express = require("express");
const router = express.Router();

// Import modular actions from purchase subfolder
const createPurchase = require("../controllers/purchase/createPurchase");
const getPurchases = require("../controllers/purchase/getPurchases");

router.post("/", createPurchase);
router.get("/", getPurchases);

module.exports = router;