const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

// Modular Admin User Actions
const getAllUsers = require("../controllers/admin-user/getAllUsers");
const toggleBlockUser = require("../controllers/admin-user/toggleBlockUser");
const deleteUser = require("../controllers/admin-user/deleteUser");
const getUserDetails = require("../controllers/admin-user/getUserDetails");

// Modular Admin Order Actions
const getAllOrders = require("../controllers/admin-order/getAllOrders");
const updateOrderStatus = require("../controllers/admin-order/updateOrderStatus");
const exportOrdersExcel = require("../controllers/admin-order/exportOrdersExcel");

// Modular Admin Dashboard Actions
const getDashboardStats = require("../controllers/admin-dashboard/getDashboardStats");

// Modular Admin Coupon Actions
const createCoupon = require("../controllers/admin-coupon/createCoupon");
const getCoupons = require("../controllers/admin-coupon/getCoupons");
const updateCoupon = require("../controllers/admin-coupon/updateCoupon");
const deleteCoupon = require("../controllers/admin-coupon/deleteCoupon");

// Modular Admin Offer Actions
const createOffer = require("../controllers/admin-offer/createOffer");
const getOffers = require("../controllers/admin-offer/getOffers");
const updateOffer = require("../controllers/admin-offer/updateOffer");
const deleteOffer = require("../controllers/admin-offer/deleteOffer");

// Modular Admin Message Actions
const getMessages = require("../controllers/admin-message/getMessages");
const replyMessage = require("../controllers/admin-message/replyMessage");

// Protected Admin Routes
router.get("/dashboard", protect, admin, getDashboardStats);

router.get("/users", protect, admin, getAllUsers);
router.put("/users/:id/block", protect, admin, toggleBlockUser);
router.get("/users/:id/details", protect, admin, getUserDetails);
router.delete("/users/:id", protect, admin, deleteUser);

router.get("/orders", protect, admin, getAllOrders);
router.get("/orders/export", protect, admin, exportOrdersExcel);
router.put("/orders/:id/status", protect, admin, updateOrderStatus);

// Admin Coupon Routes
router.get("/coupons", protect, admin, getCoupons);
router.post("/coupons", protect, admin, createCoupon);
router.put("/coupons/:id", protect, admin, updateCoupon);
router.delete("/coupons/:id", protect, admin, deleteCoupon);

// Admin Offer Routes
router.get("/offers", protect, admin, getOffers);
router.post("/offers", protect, admin, createOffer);
router.put("/offers/:id", protect, admin, updateOffer);
router.delete("/offers/:id", protect, admin, deleteOffer);

// Admin Message Routes
router.get("/messages", protect, admin, getMessages);
router.post("/messages/:id/reply", protect, admin, replyMessage);

module.exports = router;
