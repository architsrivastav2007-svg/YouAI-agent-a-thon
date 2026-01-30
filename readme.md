# 🌌 YouAI – Your AI-Powered Growth Companion

<div align="center">


**An emotionally intelligent AI companion that grows, learns, and evolves alongside you**
</div>

---

---

## 🌟 Introduction – A Vision Beyond Productivity

YouAI is a **next-generation AI-powered personal development platform** that goes far beyond typical habit trackers and journal apps. It's your **digital shadow**—an AI twin that watches, listens, learns, and guides you toward becoming your best self.

### What Makes YouAI Unique?

- 🧬 **Personality-Aware**: Understands you through the **OCEAN personality model** (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)
- 🔄 **Evolving Intelligence**: Your AI twin learns from your journals, routines, and behaviors—adapting its personality to match yours
- 🎯 **Context-Aware Guidance**: Provides hyper-personalized suggestions based on your unique psychological profile
- 💭 **Memory-Enabled**: Uses vector embeddings to remember and understand the context of your entire journey
- 🗣️ **Conversational**: Talk to your twin using voice—it responds with empathy and understanding

Whether you're aiming to hit your goals, understand yourself better, or just need someone to talk to – *YouAI* is here.

---

## 🧾 Project Overview

YouAI is built as a **three-part system** with an additional smart routing layer on top:

- **Frontend (Next.js 15, TypeScript)** – The user-facing app for onboarding, personality tests, goals, routines, journaling, analytics, and AI chat/voice.
- **Backend (Node.js + Express)** – REST API for authentication, data models (users, journals, routines, goals, personality), subscriptions, and AI orchestration.
- **Embeddings Service (Python + Flask)** – A separate service that converts text (e.g., journals) into embeddings and stores/queries them from **Pinecone** for semantic memory.
- **Decision Agent Layer** – An LLM-based router that decides whether each message should use RAG, pure chat, actions (e.g., create goal), or clarification.

High-level request flow:

1. The **frontend** sends an authenticated request (e.g., journal, goal, or chat message) to the **backend**.
2. The **backend** reads/writes data in **MongoDB** and uses **Redis** for caching and OTP/session flows.
3. For semantic memory, the backend calls the **embeddings service** and **Pinecone**.
4. For intelligence, the backend calls **Groq** and **OpenAI** models, often via the **Decision Agent**, to generate context-aware responses.

The sections below go deeper into features, tech stack, architecture, and detailed APIs.

---

## 🚀 Core Features

### 🎯 **Goal Tracking**
Set meaningful goals with deadlines. Your AI twin monitors your progress daily, provides intelligent nudges, and celebrates your wins.

### ⏰ **Routine Builder & Tracker**
Design your ideal day with custom routines. The AI analyzes your adherence patterns and suggests optimizations to help you build lasting habits.

### 📔 **Smart Journaling with Vector Embeddings**
Write, reflect, and grow. Every journal entry is transformed into semantic embeddings using `sentence-transformers`, allowing your AI twin to truly *understand* your thoughts, emotions, and patterns over time.

### 🧠 **Dynamic Personality Mapping (OCEAN Traits)**
- Complete an intelligent MCQ-based personality assessment
- Your OCEAN traits (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism) are mapped
- Watch your personality evolve as your behaviors and journal entries influence your psychological profile
- Visualize changes with beautiful, interactive charts

### 🗣️ **Conversational AI (Voice-Enabled)**
- Talk to your AI twin using voice input (WebSpeech API)
- Get spoken responses using browser text-to-speech (SpeechSynthesis API)
- Natural conversations powered by **Groq LLM** with personality-aware context
- Your twin remembers your entire history through RAG (Retrieval Augmented Generation)

### 📊 **Personality Trend Analytics**
Track how your behaviors influence your OCEAN traits over time. Visualize your mental and emotional growth with dynamic charts and insights.

### 💡 **Hyper-Personalized AI Suggestions**
Get contextual advice tailored to:
- Your unique personality profile
- Current goals and progress
- Daily routines and adherence
- Journaling patterns and emotional states
- Historical context from your entire journey

### 🌌 **Dream Mode (Experimental)**
An immersive, starry-night visualization of your possible future—complete with AI narration and ambient music. A poetic, meditative experience powered by your own growth data.

### 🛎️ **Smart Reminders & Encouragements**
Your AI twin occasionally speaks to you through browser voice synthesis—motivating you, checking in, and providing timely reminders like a friend who truly cares.

---

## 🛠 Tech Stack

### **Frontend**
| Technology | Purpose |
|-----------|---------|
| **Next.js 15** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **TailwindCSS** | Utility-first styling |
| **shadcn/ui** | Beautiful, accessible component library |
| **Framer Motion** | Smooth animations |
| **Zod** | Runtime type validation |
| **React Hook Form** | Form state management |
| **Axios** | HTTP client |
| **SpeechSynthesis API** | Text-to-speech |
| **WebSpeech API** | Speech recognition |
| **Howler.js** | Audio playback |
| **Recharts** | Data visualization |

### **Backend**
| Technology | Purpose |
|-----------|---------|
| **Node.js + Express** | RESTful API server |
| **MongoDB + Mongoose** | NoSQL database & ODM |
| **Redis** | Session storage & caching |
| **JWT** | Authentication (optional) |
| **Nodemailer** | Email notifications |
| **Groq SDK** | LLM API integration |

### **AI & ML**
| Technology | Purpose |
|-----------|---------|
| **Python Flask** | Embeddings microservice |
| **PyTorch** | Deep learning framework |
| **sentence-transformers** | Semantic text embeddings (`all-MiniLM-L6-v2`) |
| **Pinecone** | Vector database for RAG |
| **Groq LLM** | Conversational AI (Meta Llama models) |
| **NumPy** | Numerical computations |

### **DevOps & Tools**
| Technology | Purpose |
|-----------|---------|
| **pnpm** | Fast, disk-efficient package manager |
| **Git** | Version control |
| **dotenv** | Environment variable management |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                       │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌────────────────┐   │
│  │  Pages  │  │ Actions │  │Components│  │ Speech/Voice   │   │
│  └────┬────┘  └────┬────┘  └─────┬────┘  └────────┬───────┘   │
└───────┼────────────┼─────────────┼─────────────────┼───────────┘
        │            │             │                 │
        └────────────┴─────────────┴─────────────────┘
                            │ HTTP/REST
        ┌───────────────────┴──────────────────────────────────┐
        │                                                        │
┌───────▼──────────────────────┐      ┌──────────────────────▼──┐
│   Backend API (Express)      │      │  Embeddings Service     │
│  ┌──────────┐ ┌────────────┐│      │      (Flask + ML)       │
│  │Controllers│ │Middlewares ││      │  ┌──────────────────┐  │
│  └─────┬────┘ └──────┬─────┘│      │  │sentence-transformers │
│        │             │       │      │  └─────────┬────────┘  │
│  ┌─────▼─────┐ ┌────▼─────┐ │      │  ┌─────────▼────────┐  │
│  │  Models   │ │  Routes  │ │      │  │  all-MiniLM-L6-v2│  │
│  └─────┬─────┘ └────┬─────┘ │      │  └──────────────────┘  │
└────────┼────────────┼────────┘      └──────────┬──────────────┘
         │            │                           │
    ┌────▼────┐  ┌───▼──────┐           ┌────────▼────────┐
    │ MongoDB │  │  Redis   │           │  Pinecone DB    │
    │ (Data)  │  │ (Cache)  │           │  (Vectors/RAG)  │
    └─────────┘  └──────────┘           └─────────────────┘
                      │
              ┌───────▼────────┐
              │   Groq LLM     │
              │ (Meta Llama)   │
              └────────────────┘
```

### Key Architectural Highlights

1. **Microservices Design**: Separate embeddings service for ML workload isolation
2. **Vector RAG**: Journal embeddings stored in Pinecone for semantic search
3. **Personality Evolution**: OCEAN traits dynamically updated based on user behavior
4. **Session Management**: Redis for fast OTP verification and session handling
5. **Simple Authentication**: Header-based auth (`x-user-id`) for demo/development

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **Python** 3.8+ ([Download](https://python.org/))
- **pnpm** ([Install](https://pnpm.io/installation))
- **MongoDB** (Local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Redis** (Local or [Redis Cloud](https://redis.com/))
- **Git**


### Environment Setup

#### **Backend** (`backend/.env`)
```env
# Server
PORT=5000

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/neuratwin

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Email (Nodemailer)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Groq AI
GROQ_API_KEY=your-groq-api-key

# Pinecone
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=neuratwin-embeddings
```

#### **Frontend** (`frontend/.env.local`)
```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# Groq AI (for client-side features)
NEXT_PUBLIC_GROQ_KEY=your-groq-api-key
```

#### **Embeddings Service** (`embeddings/.env`)
```env
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=neuratwin-embeddings
```

### Running the Application

#### **1. Start Backend Server**
```bash
cd backend
node server.js
```
Server will run on `http://localhost:5000`

#### **2. Start Embeddings Service**
```bash
cd embeddings
python main.py
```
Service will run on `http://localhost:6000`

#### **3. Start Frontend**
```bash
cd frontend
pnpm dev
```
App will run on `http://localhost:3001`

### Accessing the Application

Open your browser and navigate to:
```
http://localhost:3001
```

---

## 📁 Project Structure

```
NeuraTwin-HackCBS-Project/
│
├── backend/                    # Express.js API Server
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/           # Route handlers
│   │   ├── chatController.js
│   │   ├── GoalController.js
│   │   ├── JournalController.js
│   │   ├── PersonalityController.js
│   │   └── ...
│   ├── middlewares/
│   │   └── SimpleAuth.js      # Authentication middleware
│   ├── models/                # Mongoose schemas
│   │   ├── User.js
│   │   ├── Journal.js
│   │   ├── Routine.js
│   │   └── chatHistory.js
│   ├── routes/                # API routes
│   ├── helper/
│   │   ├── groq.js           # Groq LLM integration
│   │   ├── mailer.js         # Email service
│   │   └── redisClient.js    # Redis client
│   ├── validators/            # Zod schemas
│   ├── server.js             # Express app entry
│   └── package.json
│
├── frontend/                  # Next.js 15 App
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   │   ├── home/
│   │   │   ├── login/
│   │   │   ├── personality-test/
│   │   │   └── profile-update/
│   │   ├── components/       # React components
│   │   │   ├── ui/           # shadcn components
│   │   │   ├── GoalManager.tsx
│   │   │   ├── PersonalityChart.tsx
│   │   │   └── ...
│   │   ├── lib/              # Utilities
│   │   │   ├── api.ts        # Axios instance
│   │   │   ├── groqClient.ts
│   │   │   └── ...
│   │   ├── schemas/          # Zod validation
│   │   └── types/            # TypeScript types
│   ├── public/               # Static assets
│   └── package.json
│
├── embeddings/               # Python Embeddings Service
│   ├── main.py              # Flask API
│   ├── requirements.txt     # Python dependencies
│   └── .env
│
├── README.md                # This file
└── package.json

## 🧠 Decision Agent – Smart Routing Layer

YouAI includes a **Decision Agent** that sits in front of the existing RAG and chat agents. It classifies each incoming user query and routes it to the right downstream handler, improving performance, cost, and extensibility.

### What the Decision Agent Does

- Uses an LLM to classify each query into one of several categories:
  - `RAG_QUERY` – Needs vector DB retrieval (e.g., "What did I write yesterday?").
  - `CHAT_QUERY` – Pure conversation (e.g., "Hello! How are you?").
  - `ACTION_QUERY` – Asks the system to perform some action (e.g., "Create a new goal").
  - `CLARIFICATION` – Query is ambiguous; ask the user to clarify.
- Calls `mainAgent()` to route the query to the appropriate handler:
  - RAG → existing RAG agent (Pinecone + LLM).
  - Chat → existing chat agent (no vector DB).
  - Action → placeholder hooks for future tools.
  - Clarification → returns a clarification message.
- Falls back safely to `CHAT_QUERY` if anything fails in classification.

### Backend Files Involved

- `backend/helper/decisionAgent.js`
  - Implements `decisionAgent()` (classifier) and `mainAgent()` (router).
  - Contains handler functions for RAG, chat, actions, and clarification.
- `backend/controllers/SmartChatController.js`
  - Exposes `POST /api/smart-chat` and test endpoints.
  - Uses `mainAgent()` to handle user messages.
- `backend/routes/SmartChatRoute.js`
  - Registers smart chat routes and hooks them into the Express app.
- `backend/testDecisionAgent.js`
  - Standalone script with 25+ test prompts for local verification.

### Smart Chat API (Decision Agent Entry Point)

```http
POST /api/smart-chat
Content-Type: application/json
Authorization: Bearer <token>
```

**Example request:**

```json
{
  "message": "What did I write in my journal yesterday?",
  "includeHistory": true,
  "topK": 5
}
```

**Example response:**

```json
{
  "success": true,
  "message": "According to your journal from yesterday...",
  "category": "RAG_QUERY",
  "contextUsed": true,
  "needsClarification": false
}
```

To test classification only, you can call:

```http
POST /api/smart-chat/test-classify
Authorization: Bearer <token>
```

```json
{
  "query": "Create a reminder for tomorrow"
}
```

→ Returns a JSON payload with the inferred `category` such as `ACTION_QUERY`.

### Configuration & Models

In `backend/.env` you must set:

```env
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key
```

- **Decision Agent**: Uses a Groq Llama 4 Scout model (low temperature) for deterministic classification.
- **Chat/RAG**: Uses OpenAI GPT‑4o (or similar) for conversational responses.

You can change these models in the corresponding helper files while keeping the Decision Agent API the same.

### Extending the Decision Agent

You can add new categories (for example, `ANALYTICS_QUERY` for stats/insights) by:

1. Updating the decision prompt in `backend/helper/decisionAgent.js` to document the new label.
2. Adding a new handler function (e.g., `handleAnalytics`) that implements the behavior.
3. Extending the `mainAgent()` switch to route that category to your handler.

The design keeps decision logic separate from execution logic and uses a plugin-style pattern, so new capabilities can be added without touching existing RAG/chat code.

## 🤖 Why YouAI?

In a world flooded with productivity tools, **YouAI stands apart**:

| Traditional Apps | YouAI |
|-----------------|-----------|
| ❌ Generic advice | ✅ Personality-aware guidance |
| ❌ Forgets your history | ✅ Remembers everything via embeddings |
| ❌ One-size-fits-all | ✅ Evolves with YOUR personality |
| ❌ Silent trackers | ✅ Conversational, voice-enabled friend |
| ❌ Static data | ✅ Dynamic psychological insights |

**YouAI doesn't just manage your tasks – it mirrors your mind**, gently guiding you to become who you truly want to be.

### It's **your future self, living beside you.**

---

### Areas We Need Help With:
- 🐛 Bug fixes
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- 🧪 Testing
- 🌐 Internationalization (i18n)
- ♿ Accessibility improvements

---
---

## 🌐 Links
- 📧 **Contact**:architsrivastav2007@gmail.com
---

<div align="center">

**Made with ❤️ by the team Byte**

⭐ **Star us on GitHub** — it helps!


</div>
