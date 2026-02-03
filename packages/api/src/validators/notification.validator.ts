import { z } from 'zod';

// Notification Types
export const NotificationType = z.enum([
  'SYSTEM_ALERT',
  'DEAL_ASSIGNED',
  'DEAL_STAGE_CHANGED',
  'DEAL_WON',
  'DEAL_LOST',
  'TASK_ASSIGNED',
  'TASK_DUE_SOON',
  'TASK_OVERDUE',
  'APPOINTMENT_REMINDER',
  'PROJECT_ASSIGNED',
  'PROJECT_STATUS_CHANGED',
  'PROJECT_DEADLINE_APPROACHING',
  'QUOTE_APPROVED',
  'INVOICE_PAID',
  'INVOICE_OVERDUE',
  'STOCK_LOW',
  'EMAIL_RECEIVED'
]);

export const NotificationChannel = z.enum(['IN_APP', 'EMAIL', 'PUSH', 'SMS']);
export const NotificationPriority = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

// Get notifications query
export const getNotificationsSchema = z.object({
  query: z.object({
    unreadOnly: z.string().optional(),
    type: NotificationType.optional(),
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    pageSize: z.string().optional().transform(val => val ? parseInt(val) : 20)
  })
});

// Mark notification as read
export const markAsReadSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID notifica richiesto')
  })
});

// Create notification
export const createNotificationSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'ID utente richiesto'),
    type: NotificationType,
    title: z.string().min(1, 'Titolo richiesto').max(200),
    message: z.string().min(1, 'Messaggio richiesto').max(1000),
    data: z.record(z.any()).optional(),
    channels: z.array(NotificationChannel).optional().default(['IN_APP']),
    priority: NotificationPriority.optional().default('NORMAL'),
    scheduledFor: z.string().datetime().optional(),
    contactId: z.string().optional(),
    companyId: z.string().optional(),
    dealId: z.string().optional(),
    projectId: z.string().optional()
  })
});

// Send bulk notification
export const sendBulkNotificationSchema = z.object({
  body: z.object({
    userIds: z.array(z.string()).min(1, 'Almeno un utente richiesto'),
    type: NotificationType,
    title: z.string().min(1, 'Titolo richiesto').max(200),
    message: z.string().min(1, 'Messaggio richiesto').max(1000),
    data: z.record(z.any()).optional(),
    channels: z.array(NotificationChannel).optional().default(['IN_APP']),
    priority: NotificationPriority.optional().default('NORMAL')
  })
});

// Update preferences
export const updatePreferencesSchema = z.object({
  body: z.record(z.object({
    enabled: z.boolean(),
    channels: z.array(NotificationChannel)
  }))
});

// Push subscription
export const subscribePushSchema = z.object({
  body: z.object({
    endpoint: z.string().url('Endpoint non valido'),
    p256dh: z.string().min(1, 'Chiave p256dh richiesta'),
    auth: z.string().min(1, 'Chiave auth richiesta'),
    userAgent: z.string().optional()
  })
});

export default {
  getNotificationsSchema,
  markAsReadSchema,
  createNotificationSchema,
  sendBulkNotificationSchema,
  updatePreferencesSchema,
  subscribePushSchema
};
