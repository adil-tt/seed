const express = require("express");
const router = express.Router();
const addAddress = require("../controllers/address/addAddress");
const getUserAddresses = require("../controllers/address/getUserAddresses");
const setDefaultAddress = require("../controllers/address/setDefaultAddress");
const deleteAddress = require("../controllers/address/deleteAddress");
const { validateAddress } = require("../middleware/addressValidator");

// Import the auth middleware
// Note: assuming it's exported as `protect` from authMiddleware (or the respective file used globally in other routes)
const { protect } = require("../middleware/authMiddleware");

// Routes
router.post("/add", protect, validateAddress, addAddress);
router.get("/my", protect, getUserAddresses);
router.put("/:id/default", protect, setDefaultAddress);
router.delete("/:id", protect, deleteAddress);

module.exports = router;
