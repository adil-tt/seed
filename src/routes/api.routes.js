const express = require("express");
const router = express.Router();


router.use("/auth", require("./auth.routes"));
router.use("/products", require("./productRoutes"));
router.use("/suppliers", require("./supplierRoutes"));
router.use("/purchases", require("./purchaseRoutes"));
router.use("/upload", require("./uploadRoutes"));
router.use("/categories", require("./categoryRoutes"));
router.use("/cart", require("./cartRoutes"));
router.use("/wishlist", require("./wishlistRoutes"));
router.use("/address", require("./addressRoutes"));
router.use("/orders", require("./orderRoutes"));
router.use("/payment", require("./paymentRoutes"));
router.use("/coupons", require("./couponRoutes"));
router.use("/offers", require("./offerRoutes"));
router.use("/admin", require("./admin.routes"));
router.use("/contact", require("./contactRoutes"));

module.exports = router;