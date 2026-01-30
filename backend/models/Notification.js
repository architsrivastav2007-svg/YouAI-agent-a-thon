/**
 * PHASE 1 - Notification Model
 * 
 * Stores web app notifications for SOS system
 * Types: SOS | LOCATION_REQUEST | AUTO_SOS
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient email
  toEmail: {
    type: String,
    required: true,
    index: true
  },

  // Notification type
  type: {
    type: String,
    enum: ['SOS', 'LOCATION_REQUEST', 'AUTO_SOS', 'LOCATION_SHARED', 'LOCATION_DENIED'],
    required: true
  },

  // Notification message
  message: {
    type: String,
    required: true
  },

  // Read status
  read: {
    type: Boolean,
    default: false
  },

  // Additional data (location, etc.)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for querying unread notifications
notificationSchema.index({ toEmail: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
