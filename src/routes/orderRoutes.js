const express = require("express");
const router = express.Router();
const { getMyOrders } = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

// Routes
router.get("/my", protect, getMyOrders);

module.exports = router;
