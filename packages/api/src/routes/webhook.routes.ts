import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as webhookController from '../controllers/webhook.controller';

const router = Router();

// ============================================
// INCOMING WEBHOOKS (Public endpoints)
// ============================================

// Handle incoming webhook (no auth - uses webhook secret)
router.post('/incoming/:endpoint', webhookController.handleIncomingWebhook);
router.get('/incoming/:endpoint', webhookController.handleIncomingWebhook);

// All other routes require authentication
router.use(authenticate);

// ============================================
// WEBHOOK EVENTS
// ============================================

// Get available webhook events
router.get('/events', webhookController.getWebhookEvents);

// ============================================
// OUTBOUND WEBHOOKS
// ============================================

// Get all outbound webhooks
router.get('/', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), webhookController.getWebhooks);

// Get single webhook
router.get('/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), webhookController.getWebhook);

// Create webhook
router.post('/', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), webhookController.createWebhook);

// Update webhook
router.put('/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), webhookController.updateWebhook);

// Delete webhook
router.delete('/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO']), webhookController.deleteWebhook);

// Toggle webhook active status
router.post('/:id/toggle', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), webhookController.toggleWebhook);

// Test webhook
router.post('/:id/test', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), webhookController.testWebhook);

// Get webhook delivery logs
router.get('/:id/deliveries', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), webhookController.getWebhookDeliveries);

// Retry failed delivery
router.post('/:id/deliveries/:deliveryId/retry', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), webhookController.retryDelivery);

// ============================================
// INCOMING WEBHOOKS MANAGEMENT
// ============================================

// Get all incoming webhooks
router.get('/incoming-config', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), webhookController.getIncomingWebhooks);

// Get single incoming webhook
router.get('/incoming-config/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), webhookController.getIncomingWebhook);

// Create incoming webhook
router.post('/incoming-config', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), webhookController.createIncomingWebhook);

// Update incoming webhook
router.put('/incoming-config/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), webhookController.updateIncomingWebhook);

// Delete incoming webhook
router.delete('/incoming-config/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO']), webhookController.deleteIncomingWebhook);

// Regenerate webhook secret
router.post('/incoming-config/:id/regenerate-secret', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), webhookController.regenerateSecret);

// Get incoming webhook logs
router.get('/incoming-config/:id/logs', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), webhookController.getIncomingWebhookLogs);

// ============================================
// API KEYS
// ============================================

// Get all API keys
router.get('/api-keys', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), webhookController.getApiKeys);

// Create API key
router.post('/api-keys', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), webhookController.createApiKey);

// Update API key
router.put('/api-keys/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), webhookController.updateApiKey);

// Revoke API key
router.delete('/api-keys/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO']), webhookController.revokeApiKey);

// Get API key usage
router.get('/api-keys/:id/usage', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), webhookController.getApiKeyUsage);

export default router;
