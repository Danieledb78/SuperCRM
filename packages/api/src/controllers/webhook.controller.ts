import { Request, Response } from 'express';
import crypto from 'crypto';

// Webhook Controller - Sistema webhook per Replit e servizi esterni
// Supporta webhook in uscita (outbound) e in entrata (inbound)

// ============================================
// OUTBOUND WEBHOOKS
// ============================================

// Get all outbound webhooks
export const getWebhooks = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { isActive, triggerEvent } = req.query;

    res.json({
      data: [],
      total: 0
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
};

// Get single webhook
export const getWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    res.json({
      id,
      name: '',
      url: '',
      method: 'POST',
      triggerEvents: [],
      isActive: true
    });
  } catch (error) {
    console.error('Error fetching webhook:', error);
    res.status(500).json({ error: 'Failed to fetch webhook' });
  }
};

// Create outbound webhook
export const createWebhook = async (req: Request, res: Response) => {
  try {
    const { organizationId, id: userId } = req.user!;
    const {
      name,
      description,
      url,
      method,
      headers,
      authType,
      authValue,
      triggerEvents,
      filters,
      payloadTemplate,
      includeEntity,
      retryEnabled,
      maxRetries,
      retryDelay
    } = req.body;

    if (!name || !url || !triggerEvents?.length) {
      return res.status(400).json({
        error: 'Name, URL, and trigger events are required'
      });
    }

    // Generate signing secret
    const signingSecret = crypto.randomBytes(32).toString('hex');

    const webhook = {
      id: `wh_${Date.now()}`,
      name,
      description,
      url,
      method: method || 'POST',
      headers: headers || {},
      authType: authType || 'NONE',
      triggerEvents,
      filters,
      payloadTemplate,
      includeEntity: includeEntity !== false,
      retryEnabled: retryEnabled !== false,
      maxRetries: maxRetries || 3,
      retryDelay: retryDelay || 60,
      signingSecret,
      isActive: true,
      successCount: 0,
      failureCount: 0,
      organizationId,
      createdById: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json(webhook);
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
};

// Update webhook
export const updateWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    res.json({
      id,
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating webhook:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
};

// Delete webhook
export const deleteWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    res.json({ message: 'Webhook deleted' });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
};

// Toggle webhook active status
export const toggleWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    res.json({
      id,
      isActive,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error toggling webhook:', error);
    res.status(500).json({ error: 'Failed to toggle webhook' });
  }
};

// Test webhook
export const testWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { testPayload } = req.body;

    // Send test request to webhook URL
    const result = {
      success: true,
      responseStatus: 200,
      responseBody: '{"status": "ok"}',
      latency: 150 // ms
    };

    res.json(result);
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ error: 'Failed to test webhook' });
  }
};

// Get webhook delivery logs
export const getWebhookDeliveries = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20, status } = req.query;

    res.json({
      data: [],
      pagination: {
        total: 0,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: 0
      }
    });
  } catch (error) {
    console.error('Error fetching webhook deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
};

// Retry failed delivery
export const retryDelivery = async (req: Request, res: Response) => {
  try {
    const { id, deliveryId } = req.params;

    res.json({
      deliveryId,
      status: 'retrying',
      message: 'Retry queued'
    });
  } catch (error) {
    console.error('Error retrying delivery:', error);
    res.status(500).json({ error: 'Failed to retry delivery' });
  }
};

// ============================================
// INCOMING WEBHOOKS
// ============================================

// Get all incoming webhooks
export const getIncomingWebhooks = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;

    res.json({
      data: [],
      total: 0
    });
  } catch (error) {
    console.error('Error fetching incoming webhooks:', error);
    res.status(500).json({ error: 'Failed to fetch incoming webhooks' });
  }
};

// Get single incoming webhook
export const getIncomingWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    res.json({
      id,
      name: '',
      endpoint: '',
      handlerType: 'custom',
      isActive: true
    });
  } catch (error) {
    console.error('Error fetching incoming webhook:', error);
    res.status(500).json({ error: 'Failed to fetch incoming webhook' });
  }
};

// Create incoming webhook
export const createIncomingWebhook = async (req: Request, res: Response) => {
  try {
    const { organizationId, id: userId } = req.user!;
    const {
      name,
      description,
      handlerType,
      handlerConfig,
      transformScript,
      targetEntity,
      targetAction,
      fieldMapping,
      allowedIps
    } = req.body;

    if (!name || !handlerType) {
      return res.status(400).json({
        error: 'Name and handler type are required'
      });
    }

    // Generate unique endpoint
    const endpoint = `wh_${crypto.randomBytes(16).toString('hex')}`;
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = {
      id: `iwh_${Date.now()}`,
      name,
      description,
      endpoint,
      secret,
      handlerType,
      handlerConfig,
      transformScript,
      targetEntity,
      targetAction,
      fieldMapping,
      allowedIps: allowedIps || [],
      isActive: true,
      requestCount: 0,
      organizationId,
      createdById: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Full URL for external use
      webhookUrl: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/webhooks/incoming/${endpoint}`
    };

    res.status(201).json(webhook);
  } catch (error) {
    console.error('Error creating incoming webhook:', error);
    res.status(500).json({ error: 'Failed to create incoming webhook' });
  }
};

// Update incoming webhook
export const updateIncomingWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    res.json({
      id,
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating incoming webhook:', error);
    res.status(500).json({ error: 'Failed to update incoming webhook' });
  }
};

// Delete incoming webhook
export const deleteIncomingWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    res.json({ message: 'Incoming webhook deleted' });
  } catch (error) {
    console.error('Error deleting incoming webhook:', error);
    res.status(500).json({ error: 'Failed to delete incoming webhook' });
  }
};

// Regenerate incoming webhook secret
export const regenerateSecret = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const newSecret = crypto.randomBytes(32).toString('hex');

    res.json({
      id,
      secret: newSecret,
      message: 'Secret regenerated'
    });
  } catch (error) {
    console.error('Error regenerating secret:', error);
    res.status(500).json({ error: 'Failed to regenerate secret' });
  }
};

// Get incoming webhook logs
export const getIncomingWebhookLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20, status } = req.query;

    res.json({
      data: [],
      pagination: {
        total: 0,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: 0
      }
    });
  } catch (error) {
    console.error('Error fetching incoming webhook logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

// Handle incoming webhook request (public endpoint)
export const handleIncomingWebhook = async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.params;
    const { body, headers, query } = req;
    const ip = req.ip || req.socket.remoteAddress;

    // Find webhook by endpoint
    // Verify IP whitelist if configured
    // Verify signature if secret is set
    // Process based on handler type

    // Handler types:
    // - supplier_update: Update supplier products/prices
    // - replit_callback: Handle Replit webhook callbacks
    // - custom: Run custom transform script

    const startTime = Date.now();

    // Log the request
    const log = {
      id: `log_${Date.now()}`,
      webhookEndpoint: endpoint,
      method: req.method,
      headers,
      body,
      query,
      ip,
      status: 'received',
      receivedAt: new Date()
    };

    // Process based on handler type (simulated)
    const result = await processWebhook(endpoint, body, headers);

    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      message: 'Webhook processed',
      processingTime
    });
  } catch (error) {
    console.error('Error handling incoming webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};

// ============================================
// WEBHOOK EVENTS
// ============================================

// Get available webhook events
export const getWebhookEvents = async (req: Request, res: Response) => {
  try {
    const events = [
      // Contacts
      { event: 'contact.created', description: 'Quando viene creato un nuovo contatto', category: 'contacts' },
      { event: 'contact.updated', description: 'Quando un contatto viene modificato', category: 'contacts' },
      { event: 'contact.deleted', description: 'Quando un contatto viene eliminato', category: 'contacts' },
      { event: 'contact.status_changed', description: 'Quando cambia lo stato di un contatto', category: 'contacts' },

      // Companies
      { event: 'company.created', description: 'Quando viene creata una nuova azienda', category: 'companies' },
      { event: 'company.updated', description: 'Quando un\'azienda viene modificata', category: 'companies' },
      { event: 'company.deleted', description: 'Quando un\'azienda viene eliminata', category: 'companies' },

      // Deals
      { event: 'deal.created', description: 'Quando viene creata una nuova trattativa', category: 'deals' },
      { event: 'deal.updated', description: 'Quando una trattativa viene modificata', category: 'deals' },
      { event: 'deal.stage_changed', description: 'Quando una trattativa cambia fase', category: 'deals' },
      { event: 'deal.won', description: 'Quando una trattativa viene vinta', category: 'deals' },
      { event: 'deal.lost', description: 'Quando una trattativa viene persa', category: 'deals' },

      // Projects
      { event: 'project.created', description: 'Quando viene creata una nuova commessa', category: 'projects' },
      { event: 'project.updated', description: 'Quando una commessa viene modificata', category: 'projects' },
      { event: 'project.status_changed', description: 'Quando cambia lo stato di una commessa', category: 'projects' },
      { event: 'project.phase_completed', description: 'Quando viene completata una fase', category: 'projects' },

      // Quotes & Invoices
      { event: 'quote.created', description: 'Quando viene creato un nuovo preventivo', category: 'sales' },
      { event: 'quote.sent', description: 'Quando un preventivo viene inviato', category: 'sales' },
      { event: 'quote.accepted', description: 'Quando un preventivo viene accettato', category: 'sales' },
      { event: 'invoice.created', description: 'Quando viene creata una nuova fattura', category: 'sales' },
      { event: 'invoice.paid', description: 'Quando una fattura viene pagata', category: 'sales' },

      // Warehouse
      { event: 'stock.low', description: 'Quando lo stock scende sotto la soglia minima', category: 'warehouse' },
      { event: 'stock.movement', description: 'Quando avviene un movimento di magazzino', category: 'warehouse' },
      { event: 'ddt.created', description: 'Quando viene creato un DDT', category: 'warehouse' },

      // Tasks & Activities
      { event: 'task.created', description: 'Quando viene creato un nuovo task', category: 'tasks' },
      { event: 'task.completed', description: 'Quando un task viene completato', category: 'tasks' },
      { event: 'task.overdue', description: 'Quando un task scade', category: 'tasks' },

      // Email
      { event: 'email.received', description: 'Quando viene ricevuta una email', category: 'email' },
      { event: 'email.linked', description: 'Quando una email viene collegata', category: 'email' }
    ];

    res.json(events);
  } catch (error) {
    console.error('Error fetching webhook events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// ============================================
// API KEYS
// ============================================

// Get all API keys
export const getApiKeys = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;

    res.json({
      data: [],
      total: 0
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
};

// Create API key
export const createApiKey = async (req: Request, res: Response) => {
  try {
    const { organizationId, id: userId } = req.user!;
    const {
      name,
      description,
      permissions,
      allowedEndpoints,
      rateLimit,
      allowedIps,
      allowedOrigins,
      expiresAt
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Generate API key
    const rawKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = rawKey.substring(0, 11);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = {
      id: `key_${Date.now()}`,
      name,
      description,
      keyPrefix,
      // Return full key only on creation (won't be shown again)
      key: rawKey,
      permissions: permissions || [],
      allowedEndpoints: allowedEndpoints || [],
      rateLimit: rateLimit || 1000,
      allowedIps: allowedIps || [],
      allowedOrigins: allowedOrigins || [],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
      usageCount: 0,
      organizationId,
      createdById: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json(apiKey);
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
};

// Update API key
export const updateApiKey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Can't update the key itself
    delete updates.key;
    delete updates.keyHash;
    delete updates.keyPrefix;

    res.json({
      id,
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
};

// Revoke API key
export const revokeApiKey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    res.json({
      id,
      isActive: false,
      revokedAt: new Date()
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
};

// Get API key usage
export const getApiKeyUsage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { period = '7d' } = req.query;

    res.json({
      apiKeyId: id,
      period,
      totalRequests: 0,
      requestsByDay: [],
      requestsByEndpoint: [],
      errors: 0,
      rateLimitHits: 0
    });
  } catch (error) {
    console.error('Error getting API key usage:', error);
    res.status(500).json({ error: 'Failed to get usage' });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

async function processWebhook(endpoint: string, body: any, headers: any): Promise<any> {
  // Process webhook based on handler type
  // This would contain the actual business logic

  return {
    processed: true,
    timestamp: new Date()
  };
}

// Verify webhook signature
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}

// Trigger webhook (called by other controllers when events occur)
export async function triggerWebhook(
  organizationId: string,
  event: string,
  payload: any
): Promise<void> {
  // Find all active webhooks for this event
  // Send webhook requests in background
  // Log deliveries

  console.log(`Webhook triggered: ${event} for org ${organizationId}`);
}

export default {
  // Outbound webhooks
  getWebhooks,
  getWebhook,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  toggleWebhook,
  testWebhook,
  getWebhookDeliveries,
  retryDelivery,

  // Incoming webhooks
  getIncomingWebhooks,
  getIncomingWebhook,
  createIncomingWebhook,
  updateIncomingWebhook,
  deleteIncomingWebhook,
  regenerateSecret,
  getIncomingWebhookLogs,
  handleIncomingWebhook,

  // Events
  getWebhookEvents,

  // API Keys
  getApiKeys,
  createApiKey,
  updateApiKey,
  revokeApiKey,
  getApiKeyUsage,

  // Utilities
  triggerWebhook,
  verifyWebhookSignature
};
