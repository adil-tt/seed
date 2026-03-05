const express = require("express");
const router = express.Router();
const { getMyOrders, createOrder } = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

// Routes
router.get("/my", protect, getMyOrders);
router.post("/", protect, createOrder);

module.exports = router;
