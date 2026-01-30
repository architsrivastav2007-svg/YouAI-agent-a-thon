/**
 * Notification Routes
 * 
 * Endpoints for web app notifications (polling-based)
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Get unread notifications for a user
router.get('/notifications/:email', notificationController.getUnreadNotifications);

// Mark single notification as read
router.post('/notifications/read', notificationController.markAsRead);

// Mark all notifications as read for a user
router.post('/notifications/read-all', notificationController.markAllAsRead);

module.exports = router;
