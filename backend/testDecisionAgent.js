// testDecisionAgent.js
/**
 * Test Decision Agent Classification
 * 
 * Run: node testDecisionAgent.js
 * 
 * This script tests the decision agent's ability to classify queries
 * without hitting the full API endpoint.
 */

require('dotenv').config();
const { decisionAgent } = require('./helper/decisionAgent');

const TEST_QUERIES = [
  // RAG_QUERY - Should retrieve from vector DB
  "What did I write in my journal yesterday?",
  "Show me my latest journal entry",
  "What are my goals for this month?",
  "According to my notes, what was my mood last week?",
  "Find information about my fitness routine",
  
  // CHAT_QUERY - General conversation
  "Hello, how are you?",
  "What do you think about meditation?",
  "Tell me a motivational quote",
  "Good morning!",
  "Can you explain mindfulness?",
  
  // ACTION_QUERY - Requires tool/action execution
  "Create a new goal for running 5km",
  "Schedule a reminder for tomorrow at 9am",
  "Update my profile picture",
  "Delete my last journal entry",
  "Add a new routine for morning meditation",
  
  // CLARIFICATION - Ambiguous/unclear
  "I need help with that",
  "Something about yesterday",
  "Can you do something?",
  "What about it?",
  "Maybe later",
];

async function runTests() {
  console.log("🧪 Testing Decision Agent Classification\n");
  console.log("=" * 80);
  
  const results = {
    RAG_QUERY: 0,
    CHAT_QUERY: 0,
    ACTION_QUERY: 0,
    CLARIFICATION: 0,
  };
  
  for (const query of TEST_QUERIES) {
    try {
      const category = await decisionAgent(query);
      results[category]++;
      
      // Color coding for terminal output
      const emoji = {
        RAG_QUERY: "📚",
        CHAT_QUERY: "💬",
        ACTION_QUERY: "⚙️",
        CLARIFICATION: "❓",
      };
      
      console.log(`${emoji[category]} ${category.padEnd(15)} | ${query}`);
    } catch (error) {
      console.error(`❌ Error classifying: "${query}"`, error.message);
    }
  }
  
  console.log("\n" + "=".repeat(80));
  console.log("\n📊 Classification Summary:");
  console.log(`📚 RAG_QUERY:      ${results.RAG_QUERY}`);
  console.log(`💬 CHAT_QUERY:     ${results.CHAT_QUERY}`);
  console.log(`⚙️  ACTION_QUERY:   ${results.ACTION_QUERY}`);
  console.log(`❓ CLARIFICATION:  ${results.CLARIFICATION}`);
  console.log(`\n✅ Total Tested: ${TEST_QUERIES.length}`);
}

// Run tests
runTests().catch(error => {
  console.error("Test failed:", error);
  process.exit(1);
});
