/**
 * PHASE 1 - LocationRequest Model
 * 
 * Tracks location requests from trusted contact to user
 * 30-minute timeout triggers automatic SOS if not responded
 */

const mongoose = require('mongoose');

const locationRequestSchema = new mongoose.Schema({
  // User who will share location
  userEmail: {
    type: String,
    required: true,
    index: true
  },

  // Trusted contact requesting location
  receiverEmail: {
    type: String,
    required: true
  },

  // Request status
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'DENIED', 'TIMEOUT'],
    default: 'PENDING',
    index: true
  },

  // Location data (filled when accepted)
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  expiresAt: {
    type: Date,
    required: true,
    index: true
  },

  // Response timestamp
  respondedAt: Date
});

// Compound index for finding expired pending requests
locationRequestSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('LocationRequest', locationRequestSchema);
