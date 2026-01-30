// routes/RagChatRoute.js
const express = require("express");
const router = express.Router();
const { extractUserId } = require("../middlewares/SimpleAuth");
const { ragChat, quickRagChat } = require("../controllers/RagChatController");

// Main RAG + Chat endpoint
router.post("/", extractUserId, ragChat);

// Quick question endpoint
router.post("/quick", extractUserId, quickRagChat);

module.exports = router;
