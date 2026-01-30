const mongoose = require("mongoose");

const goalMilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

const goalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ["active", "completed", "paused"],
    default: "active",
  },
  progress: { type: Number, default: 0 },
  milestones: [goalMilestoneSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  achievedAt: { type: Date, default: Date.now },
  relatedGoalId: { type: mongoose.Schema.Types.ObjectId, ref: "Goal" },
});

const personalityHistorySchema = new mongoose.Schema({
  date: Date,
  scores: {
    O: Number,
    C: Number,
    E: Number,
    A: Number,
    N: Number,
  },
});

const userSchema = new mongoose.Schema({
  // Basic Info
  email: { type: String, required: true, unique: true },
  name: String,
  dob: Date,
  gender: String,
  occupation: String,
  avatar: String,

  // Goals & Milestones
  goals: [goalSchema],
  milestones: [milestoneSchema],

  // AI Twin - OCEAN Personality
  personality: {
    O: Number,
    C: Number,
    E: Number,
    A: Number,
    N: Number,
    updatedAt: Date,
    history: [personalityHistorySchema],
  },

  // Minimal Growth Tracking
  growth: {
    journalStreak: { type: Number, default: 0 },
    milestoneCount: { type: Number, default: 0 },
  },

  // Subscription
  subscription: {
    tier: {
      type: String,
      enum: ["free", "pro", "premium"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired"],
      default: "active",
    },
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
  },

  // SOS System - Multiple Emergency Contacts
  // Array of email addresses that can receive SOS alerts and request location
  // Validation: Valid email format, no duplicates
  emergencyContacts: {
    type: [String],
    default: [],
    validate: {
      validator: function(contacts) {
        // Check for valid email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return contacts.every(email => emailRegex.test(email));
      },
      message: 'All emergency contacts must be valid email addresses'
    }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save hook to remove duplicate emails from emergencyContacts
userSchema.pre('save', function(next) {
  if (this.emergencyContacts && this.emergencyContacts.length > 0) {
    // Remove duplicates (case-insensitive)
    const uniqueContacts = [...new Set(
      this.emergencyContacts.map(email => email.toLowerCase())
    )];
    this.emergencyContacts = uniqueContacts;
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
