// routes/user.routes.js
const express = require("express");
const router = express.Router();
const { getCurrentUser, logoutUser } = require("../controllers/UserController");
const { extractUserId } = require("../middlewares/SimpleAuth");

// Simple auth: extracts userId from header or uses 'demo-user'
router.get("/me", extractUserId, getCurrentUser);
router.post("/logout", logoutUser);

module.exports = router;
