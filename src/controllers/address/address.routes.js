const express = require("express");
const router = express.Router();

// Import controller actions
const addAddress = require("./addAddress");
const getUserAddresses = require("./getUserAddresses");
const setDefaultAddress = require("./setDefaultAddress");
const deleteAddress = require("./deleteAddress");

// Import middleware
const { validateAddress } = require("../../middleware/addressValidator");
const { protect } = require("../../middleware/authMiddleware");

// Routes
router.post("/add", protect, validateAddress, addAddress);
router.get("/my", protect, getUserAddresses);
router.put("/:id/default", protect, setDefaultAddress);
router.delete("/:id", protect, deleteAddress);

module.exports = router;
