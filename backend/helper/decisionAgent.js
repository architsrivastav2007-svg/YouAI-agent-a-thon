// helper/decisionAgent.js
/**
 * DECISION AGENT
 * 
 * Purpose: Routes user queries to the appropriate specialized agent
 * - Prevents RAG hallucination by only querying vector DB when needed
 * - Improves response quality by matching intent to handler
 * - Enables future scaling (add new agents without changing routing logic)
 * 
 * Flow: User Query → Decision Agent → [RAG | Chat | Action | Clarification]
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

/**
 * Decision Agent System Prompt
 * Uses few-shot learning to ensure consistent classification
 */
const DECISION_PROMPT = `You are a query classifier. Analyze the user's query and classify it into EXACTLY ONE category.

CATEGORIES:
1. RAG_QUERY - Questions about specific documents, knowledge base, or factual information that requires retrieval
2. CHAT_QUERY - General conversation, greetings, opinions, personal questions (no retrieval needed)
3. ACTION_QUERY - Requests to perform actions (create, update, delete, schedule, etc.)
4. CLARIFICATION - Ambiguous or unclear queries that need more information

CLASSIFICATION RULES:
- RAG_QUERY: "What does the document say about...", "Find information on...", "According to..."
- CHAT_QUERY: "Hello", "How are you?", "What do you think about...", "Tell me a joke"
- ACTION_QUERY: "Create a reminder", "Schedule a meeting", "Update my profile", "Delete this"
- CLARIFICATION: Vague, incomplete, or confusing queries

FEW-SHOT EXAMPLES:

Query: "What's in my latest journal entry?"
Category: RAG_QUERY

Query: "Hi there! How's it going?"
Category: CHAT_QUERY

Query: "Set a reminder for tomorrow at 9am"
Category: ACTION_QUERY

Query: "I need help with that thing"
Category: CLARIFICATION

Query: "What did I write about goals last week?"
Category: RAG_QUERY

Query: "Create a new goal for fitness"
Category: ACTION_QUERY

Query: "What do you think about AI?"
Category: CHAT_QUERY

Query: "Something about yesterday"
Category: CLARIFICATION

CRITICAL: Respond with ONLY the category name. No explanation, no extra text.

User Query: {query}

Category:`;

/**
 * Decision Agent - Classifies user queries
 * @param {string} query - User's input
 * @returns {Promise<string>} - One of: RAG_QUERY, CHAT_QUERY, ACTION_QUERY, CLARIFICATION
 */
async function decisionAgent(query) {
  const fetch = (await import("node-fetch")).default;

  try {
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      console.warn("[decisionAgent] Empty query, defaulting to CLARIFICATION");
      return "CLARIFICATION";
    }

    // Replace {query} in prompt
    const systemPrompt = DECISION_PROMPT.replace("{query}", query);

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0, // Deterministic classification
        max_tokens: 50, // Only need category name
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[decisionAgent] API error:", errorData);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const classification = data.choices?.[0]?.message?.content?.trim();

    if (!classification) {
      console.warn("[decisionAgent] No classification returned, defaulting to CHAT_QUERY");
      return "CHAT_QUERY";
    }

    // Validate classification
    const validCategories = ["RAG_QUERY", "CHAT_QUERY", "ACTION_QUERY", "CLARIFICATION"];
    const category = classification.toUpperCase();

    if (validCategories.includes(category)) {
      console.log(`[decisionAgent] Query classified as: ${category}`);
      return category;
    } else {
      console.warn(`[decisionAgent] Invalid category "${classification}", defaulting to CHAT_QUERY`);
      return "CHAT_QUERY";
    }
  } catch (error) {
    console.error("[decisionAgent] Error:", error.message);
    // Fail gracefully - default to chat if classification fails
    return "CHAT_QUERY";
  }
}

/**
 * Main Agent - Orchestrates routing based on decision
 * This is the entry point for all user queries
 * 
 * @param {string} query - User's input
 * @param {string} userId - User identifier
 * @param {Object} options - Additional options (includeHistory, topK, etc.)
 * @returns {Promise<Object>} - {success, message, category, contextUsed}
 */
async function mainAgent(query, userId = "public-demo-user", options = {}) {
  const { ragAgent } = require("../controllers/RagChatController");
  const { chatAgent } = require("./chatAgent");

  try {
    // Step 1: Classify the query
    const category = await decisionAgent(query);

    // Step 2: Route to appropriate handler
    switch (category) {
      case "RAG_QUERY":
        console.log("[mainAgent] Routing to RAG Agent");
        return await handleRAG(query, userId, options);

      case "CHAT_QUERY":
        console.log("[mainAgent] Routing to Chat Agent");
        return await handleChat(query, userId, options);

      case "ACTION_QUERY":
        console.log("[mainAgent] Routing to Tool Agent");
        return await handleAction(query, userId, options);

      case "CLARIFICATION":
        console.log("[mainAgent] Requesting clarification");
        return {
          success: true,
          message: "I'm not quite sure what you're asking. Could you please provide more details or rephrase your question?",
          category: "CLARIFICATION",
          needsClarification: true,
        };

      default:
        // Fallback to chat
        console.warn(`[mainAgent] Unknown category: ${category}, using chat`);
        return await handleChat(query, userId, options);
    }
  } catch (error) {
    console.error("[mainAgent] Error:", error.message);
    throw error;
  }
}

/**
 * RAG Handler - Retrieves context and generates response
 */
async function handleRAG(query, userId, options) {
  const { ragAgent } = require("../controllers/RagChatController");
  const { chatAgent, buildChatHistory } = require("./chatAgent");
  const ChatHistory = require("../models/chatHistory");

  const topK = options.topK || 5;
  const includeHistory = options.includeHistory || false;

  // Retrieve context from vector DB
  const retrievedContext = await ragAgent(query, userId, topK);

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

  // Generate response with context
  const aiResponse = await chatAgent(query, retrievedContext, chatHistory);

  // Save to database
  const newChat = new ChatHistory({
    user: userId,
    prompt: query,
    response: aiResponse,
  });
  await newChat.save();

  return {
    success: true,
    message: aiResponse,
    category: "RAG_QUERY",
    contextUsed: retrievedContext.length > 0,
  };
}

/**
 * Chat Handler - Direct conversational response (no retrieval)
 */
async function handleChat(query, userId, options) {
  const { chatAgent, buildChatHistory } = require("./chatAgent");
  const ChatHistory = require("../models/chatHistory");

  const includeHistory = options.includeHistory || false;

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

  // Generate response WITHOUT context (pure chat)
  const aiResponse = await chatAgent(query, "General conversation - no specific context required.", chatHistory);

  // Save to database
  const newChat = new ChatHistory({
    user: userId,
    prompt: query,
    response: aiResponse,
  });
  await newChat.save();

  return {
    success: true,
    message: aiResponse,
    category: "CHAT_QUERY",
    contextUsed: false,
  };
}

/**
 * Action Handler - Placeholder for tool/action execution
 * 
 * TO EXTEND:
 * - Parse action type (create, update, delete, schedule)
 * - Extract parameters
 * - Call appropriate service (calendar, reminders, database)
 * - Return confirmation
 */
async function handleAction(query, userId, options) {
  // TODO: Implement action parsing and execution
  // Example actions:
  // - "Create a reminder" → reminder service
  // - "Schedule meeting" → calendar service
  // - "Update my profile" → user service

  return {
    success: true,
    message: "Action detection is working! However, action execution is not yet implemented. I've noted your request.",
    category: "ACTION_QUERY",
    actionDetected: true,
    query: query,
  };
}

module.exports = {
  decisionAgent,
  mainAgent,
  handleRAG,
  handleChat,
  handleAction,
};
