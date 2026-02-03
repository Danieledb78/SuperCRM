import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  subscribePush,
  unsubscribePush,
  createNotification,
  sendBulkNotification
} from '../controllers/notification.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// USER NOTIFICATIONS
// ============================================

// Get user notifications
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark notification as read
router.patch('/:id/read', markAsRead);

// Mark all as read
router.patch('/read-all', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

// Get user preferences
router.get('/preferences', getPreferences);

// Update preferences
router.put('/preferences', updatePreferences);

// ============================================
// PUSH NOTIFICATIONS
// ============================================

// Subscribe to push notifications
router.post('/push/subscribe', subscribePush);

// Unsubscribe from push notifications
router.delete('/push/subscribe', unsubscribePush);

// ============================================
// ADMIN / SYSTEM NOTIFICATIONS
// ============================================

// Create notification (admin/system use)
router.post('/', createNotification);

// Send bulk notification (admin use)
router.post('/bulk', sendBulkNotification);

export default router;
