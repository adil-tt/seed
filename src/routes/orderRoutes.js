const express = require("express");
const router = express.Router();

// Import modular actions from order subfolder
const getMyOrders = require("../controllers/order/getMyOrders");
const createOrder = require("../controllers/order/createOrder");
const cancelOrderItem = require("../controllers/order/cancelOrderItem");
const cancelOrder = require("../controllers/order/cancelOrder");
const returnOrder = require("../controllers/order/returnOrder");
const downloadInvoice = require("../controllers/order/downloadInvoice");

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
