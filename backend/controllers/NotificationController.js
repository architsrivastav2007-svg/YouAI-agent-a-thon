/**
 * Notification Controller
 * 
 * Handles web app notifications for SOS system
 * Uses polling (10 second intervals) instead of WebSockets
 */

const Notification = require('../models/Notification');

/**
 * GET /api/notifications/:email
 * 
 * Fetch unread notifications for a user
 * Returns notifications sorted by newest first
 */
exports.getUnreadNotifications = async (req, res) => {
  console.log('[NOTIFICATIONS] ========== GET UNREAD NOTIFICATIONS ==========');
  
  try {
    const { email } = req.params;

    if (!email) {
      console.log('[NOTIFICATIONS] ❌ Missing email parameter');
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required'
      });
    }

    console.log('[NOTIFICATIONS] Fetching unread notifications for:', email);

    // Find all unread notifications for this email
    const notifications = await Notification.find({
      toEmail: email,
      read: false
    })
    .sort({ createdAt: -1 }) // Newest first
    .limit(50); // Limit to 50 most recent

    console.log('[NOTIFICATIONS] ✅ Found', notifications.length, 'unread notification(s)');
    
    // Log notification types for debugging
    if (notifications.length > 0) {
      const types = notifications.map(n => n.type);
      console.log('[NOTIFICATIONS] Types:', types);
    }

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });

  } catch (error) {
    console.error('[NOTIFICATIONS] ❌ Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

/**
 * POST /api/notifications/read
 * 
 * Mark a notification as read
 * Body: { notificationId }
 */
exports.markAsRead = async (req, res) => {
  console.log('[NOTIFICATIONS] ========== MARK AS READ ==========');
  
  try {
    const { notificationId } = req.body;

    if (!notificationId) {
      console.log('[NOTIFICATIONS] ❌ Missing notificationId');
      return res.status(400).json({
        success: false,
        message: 'notificationId is required'
      });
    }

    console.log('[NOTIFICATIONS] Marking notification as read:', notificationId);

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      console.log('[NOTIFICATIONS] ❌ Notification not found');
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Update read status
    notification.read = true;
    await notification.save();

    console.log('[NOTIFICATIONS] ✅ Notification marked as read');
    console.log('[NOTIFICATIONS] Type:', notification.type);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    console.error('[NOTIFICATIONS] ❌ Error marking as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

/**
 * POST /api/notifications/read-all
 * 
 * Mark all notifications as read for a user
 * Body: { email }
 */
exports.markAllAsRead = async (req, res) => {
  console.log('[NOTIFICATIONS] ========== MARK ALL AS READ ==========');
  
  try {
    const { email } = req.body;

    if (!email) {
      console.log('[NOTIFICATIONS] ❌ Missing email');
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    console.log('[NOTIFICATIONS] Marking all notifications as read for:', email);

    const result = await Notification.updateMany(
      { toEmail: email, read: false },
      { read: true }
    );

    console.log('[NOTIFICATIONS] ✅ Marked', result.modifiedCount, 'notification(s) as read');

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      count: result.modifiedCount
    });

  } catch (error) {
    console.error('[NOTIFICATIONS] ❌ Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};
