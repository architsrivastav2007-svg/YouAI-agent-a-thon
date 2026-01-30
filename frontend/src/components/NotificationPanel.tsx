/**
 * Notification Panel Component
 * 
 * Polls for notifications every 10 seconds
 * Displays unread notifications with type-based styling
 * Highlights SOS and AUTO_SOS notifications
 */

"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertTriangle, MapPin, X, Check, ExternalLink } from "lucide-react";
import MapPreview from "./MapPreview";

interface Notification {
  _id: string;
  toEmail: string;
  type: "SOS" | "LOCATION_REQUEST" | "AUTO_SOS" | "LOCATION_SHARED" | "LOCATION_DENIED";
  message: string;
  read: boolean;
  data: any;
  createdAt: string;
}

interface NotificationPanelProps {
  userEmail?: string;
  className?: string;
}

export default function NotificationPanel({ userEmail, className = "" }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);

  /**
   * Fetch unread notifications from backend
   */
  const fetchNotifications = async () => {
    if (!userEmail) {
      console.log('[NOTIFICATIONS-UI] No user email, skipping fetch');
      return;
    }

    console.log('[NOTIFICATIONS-UI] ========== FETCHING NOTIFICATIONS ==========');
    console.log('[NOTIFICATIONS-UI] User email:', userEmail);

    try {
      const response = await api.get(`/api/notifications/${encodeURIComponent(userEmail)}`);
      
      console.log('[NOTIFICATIONS-UI] ✅ Response:', response.data);
      console.log('[NOTIFICATIONS-UI] Count:', response.data.count);

      if (response.data.success) {
        setNotifications(response.data.data);
        
        // Log notification types for debugging
        if (response.data.data.length > 0) {
          const types = response.data.data.map((n: Notification) => n.type);
          console.log('[NOTIFICATIONS-UI] Types:', types);
        }
      }
    } catch (error: any) {
      console.error('[NOTIFICATIONS-UI] ❌ Error fetching notifications:', error);
      // Don't show error to user for polling failures
    }
  };

  /**
   * Mark notification as read
   */
  const markAsRead = async (notificationId: string) => {
    console.log('[NOTIFICATIONS-UI] Marking as read:', notificationId);

    try {
      const response = await api.post('/api/notifications/read', {
        notificationId
      });

      console.log('[NOTIFICATIONS-UI] ✅ Marked as read');

      if (response.data.success) {
        // Remove from local state
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
      }
    } catch (error) {
      console.error('[NOTIFICATIONS-UI] ❌ Error marking as read:', error);
    }
  };

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    if (!userEmail) return;

    console.log('[NOTIFICATIONS-UI] Marking all as read for:', userEmail);

    try {
      const response = await api.post('/api/notifications/read-all', {
        email: userEmail
      });

      console.log('[NOTIFICATIONS-UI] ✅ All marked as read');

      if (response.data.success) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('[NOTIFICATIONS-UI] ❌ Error marking all as read:', error);
    }
  };

  /**
   * Setup polling - fetch every 10 seconds
   */
  useEffect(() => {
    if (!userEmail) return;

    console.log('[NOTIFICATIONS-UI] Starting notification polling (10 second interval)');

    // Fetch immediately
    fetchNotifications();

    // Then poll every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);

    return () => {
      console.log('[NOTIFICATIONS-UI] Stopping notification polling');
      clearInterval(interval);
    };
  }, [userEmail]);

  /**
   * Get notification style based on type
   */
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'SOS':
        return {
          bgColor: 'bg-red-50 border-red-200',
          iconColor: 'text-red-600',
          icon: <AlertTriangle className="w-5 h-5" />,
          priority: 'CRITICAL'
        };
      case 'AUTO_SOS':
        return {
          bgColor: 'bg-red-50 border-red-200',
          iconColor: 'text-red-700',
          icon: <AlertTriangle className="w-5 h-5" />,
          priority: 'CRITICAL'
        };
      case 'LOCATION_REQUEST':
        return {
          bgColor: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-600',
          icon: <MapPin className="w-5 h-5" />,
          priority: 'HIGH'
        };
      case 'LOCATION_SHARED':
        return {
          bgColor: 'bg-green-50 border-green-200',
          iconColor: 'text-green-600',
          icon: <Check className="w-5 h-5" />,
          priority: 'NORMAL'
        };
      case 'LOCATION_DENIED':
        return {
          bgColor: 'bg-gray-50 border-gray-200',
          iconColor: 'text-gray-600',
          icon: <X className="w-5 h-5" />,
          priority: 'NORMAL'
        };
      default:
        return {
          bgColor: 'bg-gray-50 border-gray-200',
          iconColor: 'text-gray-600',
          icon: <Bell className="w-5 h-5" />,
          priority: 'NORMAL'
        };
    }
  };

  /**
   * Format timestamp
   */
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const unreadCount = notifications.length;

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No new notifications
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notifications.map((notification) => {
                      const style = getNotificationStyle(notification.type);
                      
                      return (
                        <motion.div
                          key={notification._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-l-4 ${style.bgColor}`}
                        >
                          <div className="flex gap-3">
                            {/* Icon */}
                            <div className={`${style.iconColor} flex-shrink-0 mt-1`}>
                              {style.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {notification.type.replace(/_/g, ' ')}
                                </p>
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                  {formatTime(notification.createdAt)}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {notification.message}
                              </p>

                              {/* Show location for SOS notifications */}
                              {(notification.type === 'SOS' || notification.type === 'AUTO_SOS' || notification.type === 'LOCATION_SHARED') && 
                               notification.data?.latitude && notification.data?.longitude && (
                                <div className="mt-3">
                                  {/* Toggle Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedNotification(
                                        expandedNotification === notification._id ? null : notification._id
                                      );
                                    }}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                                  >
                                    <MapPin className="w-3 h-3" />
                                    {expandedNotification === notification._id ? 'Hide Map' : 'Show Map'}
                                  </button>

                                  {/* Map Preview - Expanded */}
                                  {expandedNotification === notification._id && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="mt-3"
                                    >
                                      <MapPreview
                                        latitude={notification.data.latitude}
                                        longitude={notification.data.longitude}
                                        accuracy={notification.data.accuracy}
                                        height="250px"
                                        showFallbackLink={true}
                                      />
                                    </motion.div>
                                  )}
                                </div>
                              )}

                              {/* Priority badge for critical notifications */}
                              {style.priority === 'CRITICAL' && (
                                <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                                  URGENT
                                </span>
                              )}

                              {/* Mark as Read Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification._id);
                                }}
                                className="inline-flex items-center gap-1 mt-3 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                              >
                                <Check className="w-3 h-3" />
                                Mark as read
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
