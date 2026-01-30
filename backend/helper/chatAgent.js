// helper/chatAgent.js
/**
 * Chat Agent for RAG Pipeline
 * Enforces strict context-only responses without hallucination
 */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o"; // or "gpt-3.5-turbo"

const SYSTEM_PROMPT = `You are a helpful AI assistant with access to retrieved documents.

CRITICAL RULES:
1. Answer questions ONLY using information from the "Retrieved Context" below
2. If the answer is not in the context, respond: "I don't have that information in the available documents."
3. Never make assumptions or generate information beyond the context
4. If context is unclear, ask clarifying questions
5. Be conversational, friendly, and concise

Retrieved Context:
{context}

Remember: Your knowledge is strictly limited to the context above.`;

/**
 * Chat Agent - Generate responses based on retrieved context
 * @param {string} userMessage - User's question
 * @param {string|Array} retrievedContext - Context from RAG (string or array)
 * @param {Array} chatHistory - Optional [{role: 'user'|'assistant', content: '...'}]
 * @returns {Promise<string>} - AI response
 */
async function chatAgent(userMessage, retrievedContext, chatHistory = []) {
  const fetch = (await import("node-fetch")).default;

  try {
    if (!userMessage || typeof userMessage !== "string") {
      throw new Error("userMessage is required");
    }

    // Format context
    let contextString = "";
    if (Array.isArray(retrievedContext)) {
      contextString = retrievedContext
        .map((item, idx) => `[${idx + 1}] ${item}`)
        .join("\n\n");
    } else if (typeof retrievedContext === "string") {
      contextString = retrievedContext;
    } else {
      contextString = "No context available";
    }

    // Build system message
    const systemMessage = SYSTEM_PROMPT.replace("{context}", contextString);

    // Build messages
    const messages = [
      { role: "system", content: systemMessage },
      ...chatHistory,
      { role: "user", content: userMessage },
    ];

    // Call OpenAI
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.4,
        max_tokens: 500,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error("No response from OpenAI");
    }

    return assistantMessage.trim();
  } catch (error) {
    console.error("[chatAgent] Error:", error.message);
    throw error;
  }
}

/**
 * Build chat history from database records
 * @param {Array} previousChats - [{prompt, response}]
 * @returns {Array} - Formatted for OpenAI
 */
function buildChatHistory(previousChats) {
  if (!Array.isArray(previousChats)) return [];
  return previousChats.flatMap((chat) => [
    { role: "user", content: chat.prompt },
    { role: "assistant", content: chat.response },
  ]);
}

module.exports = { chatAgent, buildChatHistory };
