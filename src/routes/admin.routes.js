const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");
const { getAllUsers, toggleBlockUser, deleteUser } = require("../controllers/adminUsersController");

// Protected Admin Routes
router.get("/users", protect, admin, getAllUsers);
router.put("/users/:id/block", protect, admin, toggleBlockUser);
router.delete("/users/:id", protect, admin, deleteUser);

module.exports = router;
