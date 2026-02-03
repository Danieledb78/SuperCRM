import { Request, Response } from 'express';

// Notification Controller - Sistema notifiche in-app, email, push

// ============================================
// NOTIFICATIONS
// ============================================

// Get user notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { id: userId, organizationId } = req.user!;
    const { unreadOnly, type, page = 1, pageSize = 20 } = req.query;

    const filters: any = { userId, organizationId };
    if (unreadOnly === 'true') filters.inAppRead = false;
    if (type) filters.type = type;

    // In production, fetch from database
    const notifications = {
      data: [
        {
          id: 'notif_1',
          type: 'DEAL_STAGE_CHANGED',
          title: 'Trattativa aggiornata',
          message: 'La trattativa "Impianto FV 10kW" è passata a "Negoziazione"',
          data: { entityType: 'deal', entityId: 'deal_123' },
          inAppRead: false,
          priority: 'NORMAL',
          createdAt: new Date()
        },
        {
          id: 'notif_2',
          type: 'TASK_DUE_SOON',
          title: 'Task in scadenza',
          message: 'Il task "Preparare preventivo" scade tra 2 ore',
          data: { entityType: 'task', entityId: 'task_456' },
          inAppRead: false,
          priority: 'HIGH',
          createdAt: new Date(Date.now() - 3600000)
        },
        {
          id: 'notif_3',
          type: 'PROJECT_STATUS_CHANGED',
          title: 'Commessa aggiornata',
          message: 'La commessa COM-2024-001 è ora "In Corso"',
          data: { entityType: 'project', entityId: 'proj_789' },
          inAppRead: true,
          priority: 'NORMAL',
          createdAt: new Date(Date.now() - 86400000)
        }
      ],
      pagination: {
        total: 3,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: 1
      },
      unreadCount: 2
    };

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Get unread count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.user!;

    res.json({
      count: 2,
      byType: {
        DEAL_STAGE_CHANGED: 1,
        TASK_DUE_SOON: 1
      }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    res.json({
      id,
      inAppRead: true,
      inAppReadAt: new Date()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

// Mark all as read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.user!;
    const { type } = req.query;

    res.json({
      success: true,
      markedCount: 2
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

// Get preferences
export const getPreferences = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.user!;

    const preferences = {
      // Default preferences for all notification types
      DEAL_STAGE_CHANGED: { enabled: true, channels: ['IN_APP', 'EMAIL'] },
      DEAL_WON: { enabled: true, channels: ['IN_APP', 'EMAIL', 'PUSH'] },
      DEAL_LOST: { enabled: true, channels: ['IN_APP', 'EMAIL'] },
      TASK_ASSIGNED: { enabled: true, channels: ['IN_APP', 'EMAIL'] },
      TASK_DUE_SOON: { enabled: true, channels: ['IN_APP', 'PUSH'] },
      TASK_OVERDUE: { enabled: true, channels: ['IN_APP', 'EMAIL', 'PUSH'] },
      PROJECT_ASSIGNED: { enabled: true, channels: ['IN_APP', 'EMAIL'] },
      PROJECT_STATUS_CHANGED: { enabled: true, channels: ['IN_APP'] },
      QUOTE_APPROVED: { enabled: true, channels: ['IN_APP', 'EMAIL'] },
      INVOICE_PAID: { enabled: true, channels: ['IN_APP', 'EMAIL'] },
      EMAIL_RECEIVED: { enabled: true, channels: ['IN_APP'] },
      STOCK_LOW: { enabled: true, channels: ['IN_APP', 'EMAIL'] },
      SYSTEM_ALERT: { enabled: true, channels: ['IN_APP', 'EMAIL', 'PUSH'] },
      // Quiet hours
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };

    res.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
};

// Update preferences
export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.user!;
    const preferences = req.body;

    res.json({
      success: true,
      preferences,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

// ============================================
// PUSH SUBSCRIPTIONS
// ============================================

// Subscribe to push notifications
export const subscribePush = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.user!;
    const { endpoint, p256dh, auth, userAgent } = req.body;

    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({
        error: 'Endpoint, p256dh, and auth are required'
      });
    }

    const subscription = {
      id: `push_${Date.now()}`,
      endpoint,
      p256dh,
      auth,
      userAgent,
      isActive: true,
      userId,
      createdAt: new Date()
    };

    res.status(201).json(subscription);
  } catch (error) {
    console.error('Error subscribing to push:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
};

// Unsubscribe from push notifications
export const unsubscribePush = async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body;

    res.json({ success: true, message: 'Unsubscribed from push notifications' });
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
};

// ============================================
// SEND NOTIFICATIONS (Internal use)
// ============================================

// Create and send notification
export const createNotification = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const {
      userId,
      type,
      title,
      message,
      data,
      channels,
      priority,
      scheduledFor
    } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        error: 'userId, type, title, and message are required'
      });
    }

    const notification = {
      id: `notif_${Date.now()}`,
      type,
      title,
      message,
      data,
      channels: channels || ['IN_APP'],
      priority: priority || 'NORMAL',
      scheduledFor,
      inAppRead: false,
      userId,
      organizationId,
      createdAt: new Date()
    };

    // In production:
    // 1. Save to database
    // 2. Send through configured channels (email, push, etc.)
    // 3. Use a queue for scheduled notifications

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
};

// Send notification to multiple users
export const sendBulkNotification = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { userIds, type, title, message, data, channels } = req.body;

    if (!userIds?.length || !type || !title || !message) {
      return res.status(400).json({
        error: 'userIds, type, title, and message are required'
      });
    }

    res.json({
      success: true,
      sentCount: userIds.length,
      sentAt: new Date()
    });
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
};

// ============================================
// NOTIFICATION TYPES
// ============================================

// Get available notification types
export const getNotificationTypes = async (req: Request, res: Response) => {
  try {
    const types = [
      { type: 'SYSTEM_ALERT', category: 'system', label: 'Avvisi di Sistema' },
      { type: 'DEAL_ASSIGNED', category: 'crm', label: 'Trattativa Assegnata' },
      { type: 'DEAL_STAGE_CHANGED', category: 'crm', label: 'Cambio Fase Trattativa' },
      { type: 'DEAL_WON', category: 'crm', label: 'Trattativa Vinta' },
      { type: 'DEAL_LOST', category: 'crm', label: 'Trattativa Persa' },
      { type: 'TASK_ASSIGNED', category: 'tasks', label: 'Task Assegnato' },
      { type: 'TASK_DUE_SOON', category: 'tasks', label: 'Task in Scadenza' },
      { type: 'TASK_OVERDUE', category: 'tasks', label: 'Task Scaduto' },
      { type: 'APPOINTMENT_REMINDER', category: 'calendar', label: 'Promemoria Appuntamento' },
      { type: 'PROJECT_ASSIGNED', category: 'projects', label: 'Commessa Assegnata' },
      { type: 'PROJECT_STATUS_CHANGED', category: 'projects', label: 'Cambio Stato Commessa' },
      { type: 'PROJECT_DEADLINE_APPROACHING', category: 'projects', label: 'Scadenza Commessa' },
      { type: 'QUOTE_APPROVED', category: 'sales', label: 'Preventivo Approvato' },
      { type: 'INVOICE_PAID', category: 'sales', label: 'Fattura Pagata' },
      { type: 'INVOICE_OVERDUE', category: 'sales', label: 'Fattura Scaduta' },
      { type: 'STOCK_LOW', category: 'warehouse', label: 'Scorta Bassa' },
      { type: 'EMAIL_RECEIVED', category: 'email', label: 'Email Ricevuta' },
    ];

    res.json(types);
  } catch (error) {
    console.error('Error fetching notification types:', error);
    res.status(500).json({ error: 'Failed to fetch types' });
  }
};

export default {
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
  sendBulkNotification,
  getNotificationTypes
};
