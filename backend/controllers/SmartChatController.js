// controllers/SmartChatController.js
/**
 * Smart Chat Controller with Decision Agent
 * 
 * This replaces direct RAG calls with intelligent routing:
 * - Analyzes user intent before choosing response strategy
 * - Routes to RAG only when document retrieval is needed
 * - Handles chat, actions, and clarifications separately
 * 
 * Migration: Use this endpoint instead of /api/rag-chat for intelligent routing
 */

const { mainAgent } = require("../helper/decisionAgent");

/**
 * Smart Chat Endpoint - Main entry point with decision routing
 * POST /api/smart-chat
 * 
 * Body:
 * {
 *   "message": "user query",
 *   "includeHistory": true/false (optional, default: false),
 *   "topK": 5 (optional, for RAG queries)
 * }
 */
exports.smartChat = async (req, res) => {
  try {
    const { message, includeHistory = false, topK = 5 } = req.body;
    const userId = req.userId; // from auth middleware

    // Validation
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message is required and cannot be empty",
      });
    }

    // Process through decision agent
    const result = await mainAgent(message, userId, {
      includeHistory,
      topK,
    });

    // Return response with metadata
    res.json({
      success: result.success,
      message: result.message,
      category: result.category,
      contextUsed: result.contextUsed || false,
      needsClarification: result.needsClarification || false,
      actionDetected: result.actionDetected || false,
    });
  } catch (error) {
    console.error("[smartChat] Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to process request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Test Decision Agent - For debugging/testing classification
 * POST /api/smart-chat/test-classify
 * 
 * Body: { "query": "test query" }
 * Returns: { "category": "RAG_QUERY" }
 */
exports.testClassification = async (req, res) => {
  const { decisionAgent } = require("../helper/decisionAgent");

  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query is required",
      });
    }

    const category = await decisionAgent(query);

    res.json({
      success: true,
      query,
      category,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[testClassification] Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Classification failed",
    });
  }
};

/**
 * Batch Classification - Test multiple queries at once
 * POST /api/smart-chat/batch-classify
 * 
 * Body: { "queries": ["query1", "query2", ...] }
 */
exports.batchClassify = async (req, res) => {
  const { decisionAgent } = require("../helper/decisionAgent");

  try {
    const { queries } = req.body;

    if (!Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Queries array is required",
      });
    }

    const results = await Promise.all(
      queries.map(async (query) => ({
        query,
        category: await decisionAgent(query),
      }))
    );

    res.json({
      success: true,
      results,
      total: results.length,
    });
  } catch (error) {
    console.error("[batchClassify] Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Batch classification failed",
    });
  }
};

module.exports = exports;
