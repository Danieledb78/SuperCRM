import { Request, Response } from 'express';
import prisma, { getPaginationParams, createPaginatedResult, handlePrismaError } from '../lib/prisma';

// Notification Controller - Sistema notifiche in-app, email, push

// ============================================
// NOTIFICATIONS
// ============================================

// Get user notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { id: userId, organizationId } = req.user!;
    const { unreadOnly, type, page = 1, pageSize = 20 } = req.query;

    const where: any = { userId, organizationId };
    if (unreadOnly === 'true') where.inAppRead = false;
    if (type) where.type = type;

    const { skip, take } = getPaginationParams({
      page: Number(page),
      pageSize: Number(pageSize)
    });

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
          company: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } },
          project: { select: { id: true, code: true, name: true } },
        }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, organizationId, inAppRead: false }
      })
    ]);

    const result = createPaginatedResult(notifications, total, {
      page: Number(page),
      pageSize: Number(pageSize)
    });

    res.json({ ...result, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Get unread count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const { id: userId, organizationId } = req.user!;

    const [count, byType] = await Promise.all([
      prisma.notification.count({
        where: { userId, organizationId, inAppRead: false }
      }),
      prisma.notification.groupBy({
        by: ['type'],
        where: { userId, organizationId, inAppRead: false },
        _count: true
      })
    ]);

    const typeCount = byType.reduce((acc, item) => {
      acc[item.type] = item._count;
      return acc;
    }, {} as Record<string, number>);

    res.json({ count, byType: typeCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user!;

    const notification = await prisma.notification.updateMany({
      where: { id, userId },
      data: {
        inAppRead: true,
        inAppReadAt: new Date()
      }
    });

    if (notification.count === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ id, inAppRead: true, inAppReadAt: new Date() });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ error: message });
  }
};

// Mark all as read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const { id: userId, organizationId } = req.user!;
    const { type } = req.query;

    const where: any = { userId, organizationId, inAppRead: false };
    if (type) where.type = type;

    const result = await prisma.notification.updateMany({
      where,
      data: {
        inAppRead: true,
        inAppReadAt: new Date()
      }
    });

    res.json({ success: true, markedCount: result.count });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user!;

    await prisma.notification.deleteMany({
      where: { id, userId }
    });

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ error: message });
  }
};

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

// Get preferences
export const getPreferences = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.user!;

    const preferences = await prisma.notificationPreference.findMany({
      where: { userId }
    });

    // Build preferences object with defaults
    const defaultPreferences = {
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
    };

    // Override with user preferences
    preferences.forEach(pref => {
      (defaultPreferences as any)[pref.type] = {
        enabled: pref.enabled,
        channels: pref.channels
      };
    });

    // Get quiet hours setting
    const quietHoursPref = preferences.find(p => p.type === 'QUIET_HOURS');
    const quietHours = quietHoursPref ? {
      enabled: quietHoursPref.enabled,
      start: (quietHoursPref as any).quietHoursStart || '22:00',
      end: (quietHoursPref as any).quietHoursEnd || '08:00'
    } : {
      enabled: false,
      start: '22:00',
      end: '08:00'
    };

    res.json({ ...defaultPreferences, quietHours });
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

    // Update each preference
    const updates = Object.entries(preferences).map(async ([type, config]: [string, any]) => {
      if (type === 'quietHours') return;

      return prisma.notificationPreference.upsert({
        where: {
          userId_type: { userId, type: type as any }
        },
        create: {
          userId,
          type: type as any,
          enabled: config.enabled,
          channels: config.channels,
        },
        update: {
          enabled: config.enabled,
          channels: config.channels,
        }
      });
    });

    await Promise.all(updates.filter(Boolean));

    res.json({ success: true, preferences, updatedAt: new Date() });
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

    // Check if subscription already exists
    const existing = await prisma.pushSubscription.findFirst({
      where: { endpoint }
    });

    if (existing) {
      // Update existing subscription
      const updated = await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: { p256dh, auth, userAgent, isActive: true, userId }
      });
      return res.json(updated);
    }

    const subscription = await prisma.pushSubscription.create({
      data: {
        endpoint,
        p256dh,
        auth,
        userAgent,
        isActive: true,
        userId
      }
    });

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
    const { id: userId } = req.user!;

    if (endpoint) {
      await prisma.pushSubscription.updateMany({
        where: { endpoint, userId },
        data: { isActive: false }
      });
    } else {
      // Unsubscribe all for user
      await prisma.pushSubscription.updateMany({
        where: { userId },
        data: { isActive: false }
      });
    }

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
      scheduledFor,
      contactId,
      companyId,
      dealId,
      projectId
    } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        error: 'userId, type, title, and message are required'
      });
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        data: data || {},
        channels: channels || ['IN_APP'],
        priority: priority || 'NORMAL',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        inAppRead: false,
        userId,
        organizationId,
        contactId,
        companyId,
        dealId,
        projectId
      }
    });

    // TODO: In production:
    // 1. Send email if EMAIL in channels
    // 2. Send push notification if PUSH in channels
    // 3. Queue scheduled notifications

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ error: message });
  }
};

// Send notification to multiple users
export const sendBulkNotification = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { userIds, type, title, message, data, channels, priority } = req.body;

    if (!userIds?.length || !type || !title || !message) {
      return res.status(400).json({
        error: 'userIds, type, title, and message are required'
      });
    }

    const notifications = await prisma.notification.createMany({
      data: userIds.map((userId: string) => ({
        type,
        title,
        message,
        data: data || {},
        channels: channels || ['IN_APP'],
        priority: priority || 'NORMAL',
        inAppRead: false,
        userId,
        organizationId
      }))
    });

    res.json({
      success: true,
      sentCount: notifications.count,
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
export const getNotificationTypes = async (_req: Request, res: Response) => {
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
