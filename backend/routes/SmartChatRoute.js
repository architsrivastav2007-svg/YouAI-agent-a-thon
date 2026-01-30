// routes/SmartChatRoute.js
/**
 * Smart Chat Routes with Decision Agent
 * 
 * Endpoints:
 * - POST /api/smart-chat - Main intelligent chat endpoint
 * - POST /api/smart-chat/test-classify - Test query classification
 * - POST /api/smart-chat/batch-classify - Batch classification testing
 */

const express = require("express");
const router = express.Router();
const {
  smartChat,
  testClassification,
  batchClassify,
} = require("../controllers/SmartChatController");
const { extractUserId } = require("../middlewares/SimpleAuth");

// Main smart chat endpoint - requires authentication
router.post("/", extractUserId, smartChat);

// Testing endpoints - requires authentication
router.post("/test-classify", extractUserId, testClassification);
router.post("/batch-classify", extractUserId, batchClassify);

module.exports = router;
