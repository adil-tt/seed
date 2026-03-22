const express = require("express");
const router = express.Router();
const { getMyOrders, createOrder, cancelOrderItem, cancelOrder, returnOrder, downloadInvoice } = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

// Routes
router.get("/my", protect, getMyOrders);
router.post("/", protect, createOrder);

// Order item actions and invoicing
router.put("/:orderId/cancel-item/:productId", protect, cancelOrderItem);
router.put("/:orderId/cancel", protect, cancelOrder);
router.put("/:orderId/return", protect, returnOrder);
router.get("/:orderId/invoice", protect, downloadInvoice);

module.exports = router;
