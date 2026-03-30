const express = require("express");
const router = express.Router();
const submitMessage = require("../controllers/contact/submitMessage");

router.post("/", submitMessage);

module.exports = router;
