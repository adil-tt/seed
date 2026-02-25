const express = require("express");
const router = express.Router();
const { createPurchase, getPurchases } = require("../controllers/purchaseController");

router.post("/", createPurchase);
router.get("/", getPurchases);

module.exports = router;