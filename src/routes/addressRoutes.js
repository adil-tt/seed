const express = require("express");
const router = express.Router();
const {
    addAddress,
    getUserAddresses,
    setDefaultAddress,
    deleteAddress
} = require("../controllers/addressController");
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
