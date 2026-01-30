const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { extractUserId } = require("../middlewares/SimpleAuth");

// Simple auth: extracts userId from header or uses 'demo-user'
router.post("/save", extractUserId, chatController.saveChat);
router.get("/recent", extractUserId, chatController.getRecentChats);

module.exports = router;
