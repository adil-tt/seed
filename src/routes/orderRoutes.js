const express = require("express");
const router = express.Router();

// Import modular actions from order subfolder
const getMyOrders = require("../controllers/order/getMyOrders");
const createOrder = require("../controllers/order/createOrder");
const cancelOrderItem = require("../controllers/order/cancelOrderItem");
const cancelOrder = require("../controllers/order/cancelOrder");
const returnOrder = require("../controllers/order/returnOrder");
const downloadInvoice = require("../controllers/order/downloadInvoice");

const  protect = require("../middleware/authMiddleware");
const userOnly = require("../middleware/userMiddleware");

// Routes
router.get("/my", protect, userOnly, getMyOrders);
router.post("/", protect, userOnly, createOrder);

// Order item actions and invoicing
router.put("/:orderId/cancel-item/:productId", protect, userOnly, cancelOrderItem);
router.put("/:orderId/cancel", protect, userOnly, cancelOrder);
router.put("/:orderId/return", protect, userOnly, returnOrder);
router.get("/:orderId/invoice", protect, userOnly, downloadInvoice);

module.exports = router;
