const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");
const { getAllUsers, toggleBlockUser, deleteUser } = require("../controllers/adminUsersController");
const { getAllOrders, updateOrderStatus } = require("../controllers/adminOrderController");

// Protected Admin Routes
router.get("/users", protect, admin, getAllUsers);
router.put("/users/:id/block", protect, admin, toggleBlockUser);
router.delete("/users/:id", protect, admin, deleteUser);

router.get("/orders", protect, admin, getAllOrders);
router.put("/orders/:id/status", protect, admin, updateOrderStatus);

module.exports = router;
