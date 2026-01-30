// Quick test script for Chat Agent
// Run: node backend/testChatAgent.js

require('dotenv').config();
const { chatAgent, quickAnswer } = require('./helper/chatAgent');

async function testChatAgent() {
  console.log('🧪 Testing Chat Agent...\n');

  // Test 1: Simple question with context
  console.log('Test 1: Simple Question');
  console.log('─────────────────────────');
  try {
    const context = [
      "Diabetes is a chronic metabolic disorder characterized by high blood sugar levels.",
      "Common symptoms include increased thirst, frequent urination, and fatigue."
    ];
    
    const response = await quickAnswer(
      "What is diabetes and what are its symptoms?",
      context
    );
    
    console.log('✅ Response:', response);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n');

  // Test 2: Insufficient context
  console.log('Test 2: Insufficient Context');
  console.log('─────────────────────────────');
  try {
    const response = await quickAnswer(
      "What is the cure for diabetes?",
      ["Diabetes is a metabolic disorder."]
    );
    
    console.log('✅ Response:', response);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n');

  // Test 3: With conversation history
  console.log('Test 3: With Conversation History');
  console.log('──────────────────────────────────');
  try {
    const history = [
      { role: 'user', content: 'Tell me about healthy eating' },
      { role: 'assistant', content: 'Healthy eating involves a balanced diet with fruits, vegetables, whole grains, and lean proteins.' }
    ];

    const context = [
      "A balanced diet should include 5 servings of fruits and vegetables per day.",
      "Whole grains provide essential fiber and nutrients."
    ];

    const response = await chatAgent(
      "How many vegetables should I eat?",
      context,
      history
    );
    
    console.log('✅ Response:', response);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n✨ Testing complete!');
}

// Check for API key
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY not found in .env file');
  console.log('\n📝 Add this to your .env file:');
  console.log('OPENAI_API_KEY=sk-your-api-key-here\n');
  process.exit(1);
}

// Run tests
testChatAgent();
