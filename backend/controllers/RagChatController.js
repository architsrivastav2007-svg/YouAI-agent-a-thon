// controllers/RagChatController.js
const axios = require("axios");
const { chatAgent, buildChatHistory } = require("../helper/chatAgent");
const ChatHistory = require("../models/chatHistory");

/**
 * RAG Agent - Retrieve context from Pinecone
 */
async function ragAgent(prompt, userId = "public-demo-user", topK = 5) {
  try {
    const response = await axios.post("http://localhost:6000/query", {
      prompt,
      userId,
      topK,
    });

    const matches = response.data?.matches || [];
    const contextChunks = matches.map(
      (match) => match.metadata?.text || match.text || ""
    );

    return contextChunks.filter((text) => text.length > 0);
  } catch (error) {
    console.error("[ragAgent] Error:", error.message);
    throw new Error("Failed to retrieve context");
  }
}

/**
 * Main RAG + Chat endpoint
 * POST /api/rag-chat
 */
exports.ragChat = async (req, res) => {
  try {
    const { message, includeHistory = false } = req.body;
    const userId = req.userId;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // Retrieve context
    const retrievedContext = await ragAgent(message, userId, 5);

    // Get chat history if requested
    let chatHistory = [];
    if (includeHistory) {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const recentChats = await ChatHistory.find({
        user: userId,
        createdAt: { $gte: thirtyMinutesAgo },
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("prompt response");

      chatHistory = buildChatHistory(recentChats.reverse());
    }

    // Generate response
    const aiResponse = await chatAgent(message, retrievedContext, chatHistory);

    // Save to database
    const newChat = new ChatHistory({
      user: userId,
      prompt: message,
      response: aiResponse,
    });
    await newChat.save();

    res.json({
      success: true,
      message: aiResponse,
      contextUsed: retrievedContext.length > 0,
    });
  } catch (error) {
    console.error("[ragChat] Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to process request",
    });
  }
};

/**
 * Quick Q&A without history
 * POST /api/rag-chat/quick
 */
exports.quickRagChat = async (req, res) => {
  try {
    const { question } = req.body;
    const userId = req.userId;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const context = await ragAgent(question, userId, 3);
    const answer = await chatAgent(question, context, []);

    res.json({
      success: true,
      answer,
      contextFound: context.length > 0,
    });
  } catch (error) {
    console.error("[quickRagChat] Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to answer question",
    });
  }
};
