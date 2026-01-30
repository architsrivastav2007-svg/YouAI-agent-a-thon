// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// DB Connection
const connectDB = require('./config/db');
connectDB();

// Middleware
app.use(express.json());
// app.use(cors({ origin: true, credentials: true }));
app.use(
  cors({
    // origin: 'https://www.ronitrox.xyz',
    origin: (origin, callback) => {
      callback(null, origin || '*'); // allow all origins dynamically
    },
    credentials: true,
    exposedHeaders: ['Authorization'],
  })
);

app.use(cookieParser());

// Routes
// FOR LOGIN
const loginRoutes = require('./routes/LoginRoute');
app.use('/api/auth', loginRoutes);
// FOR VERIFY OTP
const verifyOtpRoutes = require('./routes/VerifyOtpRoute');
app.use('/api/auth', verifyOtpRoutes);
// FOR USER PROFILE
const userProfileRoutes = require('./routes/UserProfileRoute');
app.use('/api/auth', userProfileRoutes);
// FOR USER
const userRoutes = require('./routes/UserRoutes');
app.use('/api/user', userRoutes);
// FOR JOURNAL
const journalRoutes = require('./routes/JournalRoute');
app.use('/api/journal', journalRoutes);
// FOR PERSONALITY
const personalityRoutes = require('./routes/PersonalityRoute');
app.use('/api/personality', personalityRoutes);
// FOR CHAT
const chatRoutes = require('./routes/chatRoute');
app.use('/api/chat', chatRoutes);
// FOR RAG CHAT
const ragChatRoute = require('./routes/RagChatRoute');
app.use('/api/rag-chat', ragChatRoute);
// FOR SMART CHAT (with Decision Agent) - TEMPORARILY DISABLED
// const smartChatRoute = require('./routes/SmartChatRoute');
// app.use('/api/smart-chat', smartChatRoute);
// FOR PINECONE
const pineconeRoute = require('./routes/pineconeRoutes');
app.use('/api/pine', pineconeRoute);
// FOR ROUTINE
const routineRoutes = require('./routes/routineRoute');
app.use('/api/routine', routineRoutes);
// FOR GOAL
const goalRoutes = require('./routes/GoalRoutes');
app.use('/api/goal', goalRoutes);
// FOR SUBSCRIPTION
const subscriptionRoutes = require('./routes/SubscriptionRoutes');
app.use('/api/subscription', subscriptionRoutes);

// ========================================
// SOS SYSTEM ROUTES (Phases 3, 4, 5)
// ========================================
const sosRoutes = require('./routes/sosRoutes');
app.use('/api', sosRoutes);

console.log('[SOS-SYSTEM] SOS routes initialized');

// ========================================
// NOTIFICATION ROUTES (Polling-based)
// ========================================
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api', notificationRoutes);

console.log('[NOTIFICATIONS] Notification routes initialized');

// ========================================
// EMERGENCY CONTACTS MANAGEMENT ROUTES
// ========================================
const emergencyContactsRoutes = require('./routes/emergencyContactsRoutes');
app.use('/api/emergency-contacts', emergencyContactsRoutes);

console.log('[EMERGENCY-CONTACTS] Emergency contacts routes initialized');

// ========================================
// PHASE 6 - AUTO SOS BACKGROUND JOB
// ========================================
const { startAutoSOSJob } = require('./jobs/autoSOSJob');
const { verifyEmailConfig } = require('./services/emailService');

// Verify email configuration on startup
verifyEmailConfig().then(isValid => {
  if (isValid) {
    console.log('[SOS-SYSTEM] ✅ Email service ready');
  } else {
    console.warn('[SOS-SYSTEM] ⚠️ Email service configuration issue - check .env file');
  }
});

// Start background job for auto SOS
startAutoSOSJob();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('[SOS-SYSTEM] 🚀 SOS system active and monitoring');
});
