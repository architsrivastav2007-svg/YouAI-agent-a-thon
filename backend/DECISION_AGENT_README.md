# Decision Agent Integration Guide

## 📁 New Files Created

```
backend/
├── helper/
│   └── decisionAgent.js          # Core decision logic + routing
├── controllers/
│   └── SmartChatController.js    # API endpoints with decision routing
├── routes/
│   └── SmartChatRoute.js         # Route definitions
└── testDecisionAgent.js          # Standalone testing script
```

## 🚀 Quick Start

### 1. Test Classification Locally

```bash
cd backend
node testDecisionAgent.js
```

This will test 25+ queries and show classification results.

### 2. API Usage

#### Basic Smart Chat Request

```javascript
POST /api/smart-chat
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "What did I write in my journal yesterday?",
  "includeHistory": true,
  "topK": 5
}
```

#### Response

```json
{
  "success": true,
  "message": "According to your journal from yesterday...",
  "category": "RAG_QUERY",
  "contextUsed": true,
  "needsClarification": false
}
```

### 3. Test Classification Endpoint

```javascript
POST /api/smart-chat/test-classify
Authorization: Bearer <token>

{
  "query": "Create a reminder for tomorrow"
}
```

Response:
```json
{
  "success": true,
  "query": "Create a reminder for tomorrow",
  "category": "ACTION_QUERY",
  "timestamp": "2026-01-28T10:30:00Z"
}
```

## 🔀 Query Categories

| Category | Description | Example |
|----------|-------------|---------|
| **RAG_QUERY** | Needs vector DB retrieval | "What did I write about goals?" |
| **CHAT_QUERY** | General conversation | "Hello! How are you?" |
| **ACTION_QUERY** | Requires tool execution | "Create a new goal" |
| **CLARIFICATION** | Ambiguous/unclear | "Something about that" |

## 🏗️ Architecture

```
User Query
    ↓
Decision Agent (LLM Classification)
    ↓
┌───────────┬───────────┬───────────┬───────────┐
│ RAG_QUERY │CHAT_QUERY │ACTION_QUERY│CLARIFICATION│
└─────┬─────┴─────┬─────┴─────┬─────┴─────┬─────┘
      ↓           ↓           ↓           ↓
  ragAgent()  chatAgent()  toolAgent() clarifyMsg()
      ↓           ↓           ↓           ↓
  Pinecone    Direct LLM   [Future]   Static Response
  + LLM                     Tools
```

## 🔧 Extending with New Agents

### Add a new category (e.g., ANALYTICS_QUERY):

1. **Update Decision Prompt** in `helper/decisionAgent.js`:

```javascript
const DECISION_PROMPT = `...
CATEGORIES:
1. RAG_QUERY - ...
2. CHAT_QUERY - ...
3. ACTION_QUERY - ...
4. ANALYTICS_QUERY - Data analysis, charts, statistics  // NEW
5. CLARIFICATION - ...
...`;
```

2. **Add Handler Function**:

```javascript
async function handleAnalytics(query, userId, options) {
  // Your analytics logic here
  return {
    success: true,
    message: "Analytics results...",
    category: "ANALYTICS_QUERY",
    data: { /* chart data */ }
  };
}
```

3. **Update Router** in `mainAgent()`:

```javascript
case "ANALYTICS_QUERY":
  console.log("[mainAgent] Routing to Analytics Agent");
  return await handleAnalytics(query, userId, options);
```

## 📝 Configuration

### Environment Variables

Ensure `.env` has:

```env
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
```

### Model Selection

- **Decision Agent**: Uses `meta-llama/llama-4-scout-17b-16e-instruct` (Groq)
- **Chat Agent**: Uses `gpt-4o` (OpenAI)

Change in respective files if needed.

## 🧪 Testing Strategy

### Unit Test Individual Components

```javascript
const { decisionAgent } = require('./helper/decisionAgent');

const category = await decisionAgent("What's in my journal?");
console.log(category); // Expected: "RAG_QUERY"
```

### Integration Test Full Flow

```javascript
const { mainAgent } = require('./helper/decisionAgent');

const result = await mainAgent(
  "Tell me about my goals",
  "user-123",
  { includeHistory: true }
);

console.log(result.category); // "RAG_QUERY"
console.log(result.message);  // AI response with context
```

### API Test with curl

```bash
curl -X POST http://localhost:5000/api/smart-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "What did I write yesterday?",
    "includeHistory": true
  }'
```

## ⚡ Performance Tips

1. **Caching**: Decision classifications can be cached for common queries
2. **Parallel Processing**: Classification runs independently - can batch
3. **Timeout Handling**: Set timeout on Groq API calls (currently none)
4. **Fallback**: Defaults to CHAT_QUERY if classification fails

## 🔒 Security

- All endpoints require authentication via `simpleAuth` middleware
- User ID from token prevents cross-user data access
- Validation on all inputs
- Error messages don't expose internals in production

## 📊 Monitoring

Log patterns to watch:

```javascript
[decisionAgent] Query classified as: RAG_QUERY
[mainAgent] Routing to RAG Agent
[ragAgent] Retrieved 5 context chunks
```

Track category distribution to optimize routing logic.

## 🆚 Migration from Old System

### Before (Direct RAG):

```javascript
POST /api/rag-chat
{ "message": "Hello" }  // Unnecessary vector search
```

### After (Smart Routing):

```javascript
POST /api/smart-chat
{ "message": "Hello" }  
// → Classified as CHAT_QUERY
// → Skips vector DB, uses direct chat
```

**Benefits:**
- Faster responses for non-RAG queries
- Reduced vector DB costs
- Better response quality (right tool for right job)

## 🐛 Troubleshooting

### Classification always returns CHAT_QUERY

- Check GROQ_API_KEY in `.env`
- Verify Groq API is responding (check logs)
- Test prompt directly in Groq playground

### "Cannot find module" errors

```bash
npm install node-fetch
```

### Empty responses

- Ensure `OPENAI_API_KEY` is valid
- Check network connectivity to APIs
- Review error logs in console

## 📚 Code Quality

- ✅ Type validation on all inputs
- ✅ Error handling with fallbacks
- ✅ Detailed logging for debugging
- ✅ Modular design for easy extension
- ✅ No changes to existing RAG/Chat logic

## 🎯 Next Steps

1. ✅ Decision Agent implemented
2. ⏳ Implement ACTION_QUERY tools (calendar, reminders, etc.)
3. ⏳ Add response caching for common queries
4. ⏳ Implement conversation context tracking
5. ⏳ Add analytics/reporting on query distribution

---

**Status**: ✅ Production Ready (with ACTION_QUERY as placeholder)

**Last Updated**: January 28, 2026
