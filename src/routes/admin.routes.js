const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");
const { getAllUsers, toggleBlockUser, deleteUser, getUserDetails } = require("../controllers/adminUsersController");
const { getAllOrders, updateOrderStatus, exportOrdersExcel } = require("../controllers/adminOrderController");
const { getDashboardStats } = require("../controllers/adminDashboardController");
const { createCoupon, getCoupons, updateCoupon, deleteCoupon } = require("../controllers/adminCouponController");
const { createOffer, getOffers, updateOffer, deleteOffer } = require("../controllers/adminOfferController");

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

module.exports = router;
