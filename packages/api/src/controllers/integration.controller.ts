import { Request, Response } from 'express';

// Integration Controller - Gestione integrazioni esterne
// Supporta: Email (Outlook/Gmail), AI (OpenAI/Claude), Suppliers, Webhooks, Custom

// ============================================
// INTEGRATIONS CRUD
// ============================================

// Get all integrations
export const getIntegrations = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { type, provider, status, isActive } = req.query;

    // Build filters
    const filters: any = { organizationId };
    if (type) filters.type = type;
    if (provider) filters.provider = provider;
    if (status) filters.status = status;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    // In a real implementation, this would query the database
    const integrations = {
      data: [],
      pagination: {
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0
      }
    };

    res.json(integrations);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
};

// Get single integration
export const getIntegration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    // In a real implementation, fetch from database
    res.json({
      message: 'Integration details',
      id,
      organizationId
    });
  } catch (error) {
    console.error('Error fetching integration:', error);
    res.status(500).json({ error: 'Failed to fetch integration' });
  }
};

// Create integration
export const createIntegration = async (req: Request, res: Response) => {
  try {
    const { organizationId, id: userId } = req.user!;
    const {
      name,
      type,
      provider,
      description,
      authType,
      apiKey,
      apiSecret,
      clientId,
      clientSecret,
      authUrl,
      tokenUrl,
      scopes,
      redirectUri,
      baseUrl,
      webhookUrl,
      config,
      mapping,
      syncSettings
    } = req.body;

    // Validate required fields
    if (!name || !type || !provider) {
      return res.status(400).json({
        error: 'Name, type, and provider are required'
      });
    }

    // In a real implementation:
    // 1. Encrypt sensitive fields (apiKey, apiSecret, etc.)
    // 2. Save to database
    // 3. Initialize integration if auto-connect

    const integration = {
      id: `int_${Date.now()}`,
      name,
      type,
      provider,
      description,
      authType: authType || 'API_KEY',
      status: 'DISCONNECTED',
      isActive: true,
      organizationId,
      createdById: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json(integration);
  } catch (error) {
    console.error('Error creating integration:', error);
    res.status(500).json({ error: 'Failed to create integration' });
  }
};

// Update integration
export const updateIntegration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;
    const updates = req.body;

    // In a real implementation, update in database
    res.json({
      message: 'Integration updated',
      id,
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating integration:', error);
    res.status(500).json({ error: 'Failed to update integration' });
  }
};

// Delete integration
export const deleteIntegration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    // In a real implementation, delete from database
    res.json({ message: 'Integration deleted successfully' });
  } catch (error) {
    console.error('Error deleting integration:', error);
    res.status(500).json({ error: 'Failed to delete integration' });
  }
};

// ============================================
// INTEGRATION CONNECTIONS
// ============================================

// Connect/authenticate integration
export const connectIntegration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;
    const { credentials } = req.body;

    // Based on integration type, perform connection:
    // - API_KEY: Test API key validity
    // - OAUTH2: Return OAuth authorization URL
    // - BASIC: Test credentials

    // For OAuth2, return auth URL
    const authUrl = `https://example.com/oauth/authorize?client_id=xxx&redirect_uri=xxx`;

    res.json({
      success: true,
      message: 'Connection initiated',
      authUrl, // For OAuth2
      status: 'CONNECTING'
    });
  } catch (error) {
    console.error('Error connecting integration:', error);
    res.status(500).json({ error: 'Failed to connect integration' });
  }
};

// OAuth callback handler
export const oauthCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    // Exchange code for tokens
    // Store tokens encrypted
    // Update integration status

    res.json({
      success: true,
      message: 'OAuth completed successfully'
    });
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.status(500).json({ error: 'OAuth callback failed' });
  }
};

// Disconnect integration
export const disconnectIntegration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Clear tokens, update status
    res.json({
      success: true,
      message: 'Integration disconnected',
      status: 'DISCONNECTED'
    });
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    res.status(500).json({ error: 'Failed to disconnect integration' });
  }
};

// Test integration connection
export const testIntegration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Perform a test request to verify connection
    res.json({
      success: true,
      message: 'Connection test successful',
      latency: 150 // ms
    });
  } catch (error) {
    console.error('Error testing integration:', error);
    res.status(500).json({ error: 'Connection test failed' });
  }
};

// ============================================
// SYNC OPERATIONS
// ============================================

// Trigger manual sync
export const syncIntegration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { syncType = 'incremental' } = req.body;

    // Start sync job
    const syncLog = {
      id: `sync_${Date.now()}`,
      integrationId: id,
      syncType,
      status: 'started',
      startedAt: new Date()
    };

    res.json({
      message: 'Sync started',
      syncLog
    });
  } catch (error) {
    console.error('Error syncing integration:', error);
    res.status(500).json({ error: 'Failed to start sync' });
  }
};

// Get sync logs
export const getSyncLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20 } = req.query;

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
    console.error('Error fetching sync logs:', error);
    res.status(500).json({ error: 'Failed to fetch sync logs' });
  }
};

// ============================================
// AVAILABLE INTEGRATIONS CATALOG
// ============================================

// Get list of available integration types
export const getAvailableIntegrations = async (req: Request, res: Response) => {
  try {
    const catalog = [
      // Email Integrations
      {
        id: 'microsoft_outlook',
        name: 'Microsoft Outlook',
        type: 'EMAIL',
        provider: 'microsoft',
        description: 'Sincronizza email da Microsoft Outlook/Office 365',
        authType: 'OAUTH2',
        icon: 'outlook',
        features: ['email_sync', 'calendar_sync', 'contact_sync'],
        configFields: [
          { name: 'syncFolders', type: 'multiselect', label: 'Cartelle da sincronizzare' },
          { name: 'syncFrequency', type: 'number', label: 'Frequenza sync (minuti)' }
        ]
      },
      {
        id: 'google_gmail',
        name: 'Google Gmail',
        type: 'EMAIL',
        provider: 'google',
        description: 'Sincronizza email da Google Gmail',
        authType: 'OAUTH2',
        icon: 'gmail',
        features: ['email_sync', 'calendar_sync', 'contact_sync']
      },

      // AI Integrations
      {
        id: 'openai',
        name: 'OpenAI (ChatGPT)',
        type: 'AI_ASSISTANT',
        provider: 'openai',
        description: 'Integra ChatGPT per assistenza AI',
        authType: 'API_KEY',
        icon: 'openai',
        features: ['chat', 'summarize', 'translate', 'analyze'],
        configFields: [
          { name: 'model', type: 'select', label: 'Modello', options: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
          { name: 'temperature', type: 'number', label: 'Temperature', min: 0, max: 2 },
          { name: 'maxTokens', type: 'number', label: 'Max Tokens' }
        ]
      },
      {
        id: 'anthropic',
        name: 'Anthropic (Claude)',
        type: 'AI_ASSISTANT',
        provider: 'anthropic',
        description: 'Integra Claude per assistenza AI',
        authType: 'API_KEY',
        icon: 'anthropic',
        features: ['chat', 'summarize', 'translate', 'analyze'],
        configFields: [
          { name: 'model', type: 'select', label: 'Modello', options: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
          { name: 'maxTokens', type: 'number', label: 'Max Tokens' }
        ]
      },

      // Supplier Integrations
      {
        id: 'supplier_api',
        name: 'API Fornitore Generico',
        type: 'SUPPLIER_API',
        provider: 'custom',
        description: 'Connetti con listini prezzi fornitori via API',
        authType: 'API_KEY',
        icon: 'supplier',
        features: ['price_sync', 'stock_check', 'order_placement'],
        configFields: [
          { name: 'baseUrl', type: 'url', label: 'URL Base API' },
          { name: 'priceEndpoint', type: 'text', label: 'Endpoint Listino' },
          { name: 'stockEndpoint', type: 'text', label: 'Endpoint Disponibilità' }
        ]
      },
      {
        id: 'csv_pricelist',
        name: 'Listino CSV/Excel',
        type: 'SUPPLIER_API',
        provider: 'file',
        description: 'Importa listini da file CSV o Excel',
        authType: 'NONE',
        icon: 'file',
        features: ['price_import', 'scheduled_import'],
        configFields: [
          { name: 'fileUrl', type: 'url', label: 'URL File (opzionale)' },
          { name: 'delimiter', type: 'select', label: 'Delimitatore', options: [',', ';', '\t'] },
          { name: 'mapping', type: 'json', label: 'Mapping Colonne' }
        ]
      },

      // Webhook Integrations
      {
        id: 'webhook_replit',
        name: 'Replit Webhook',
        type: 'WEBHOOK',
        provider: 'replit',
        description: 'Connetti con applicazioni Replit',
        authType: 'BEARER',
        icon: 'replit',
        features: ['outbound_webhook', 'inbound_webhook'],
        configFields: [
          { name: 'webhookUrl', type: 'url', label: 'URL Webhook Replit' },
          { name: 'events', type: 'multiselect', label: 'Eventi da inviare' }
        ]
      },
      {
        id: 'webhook_generic',
        name: 'Webhook Generico',
        type: 'WEBHOOK',
        provider: 'custom',
        description: 'Webhook personalizzato per qualsiasi servizio',
        authType: 'CUSTOM',
        icon: 'webhook',
        features: ['outbound_webhook', 'inbound_webhook']
      },

      // Accounting Integrations
      {
        id: 'fatture_in_cloud',
        name: 'Fatture in Cloud',
        type: 'ACCOUNTING',
        provider: 'fattureincloud',
        description: 'Sincronizza con Fatture in Cloud per fatturazione elettronica',
        authType: 'OAUTH2',
        icon: 'fattureincloud',
        features: ['invoice_sync', 'customer_sync', 'payment_sync']
      },
      {
        id: 'aruba_fatturazione',
        name: 'Aruba Fatturazione',
        type: 'ACCOUNTING',
        provider: 'aruba',
        description: 'Fatturazione elettronica con Aruba',
        authType: 'API_KEY',
        icon: 'aruba',
        features: ['e_invoice', 'sdi_send']
      },

      // ERP Integrations
      {
        id: 'sap_business_one',
        name: 'SAP Business One',
        type: 'ERP',
        provider: 'sap',
        description: 'Integrazione con SAP Business One',
        authType: 'BASIC',
        icon: 'sap',
        features: ['customer_sync', 'product_sync', 'order_sync']
      },

      // Storage Integrations
      {
        id: 'microsoft_onedrive',
        name: 'Microsoft OneDrive',
        type: 'STORAGE',
        provider: 'microsoft',
        description: 'Archivia documenti su OneDrive',
        authType: 'OAUTH2',
        icon: 'onedrive',
        features: ['file_upload', 'file_sync']
      },
      {
        id: 'google_drive',
        name: 'Google Drive',
        type: 'STORAGE',
        provider: 'google',
        description: 'Archivia documenti su Google Drive',
        authType: 'OAUTH2',
        icon: 'googledrive',
        features: ['file_upload', 'file_sync']
      }
    ];

    res.json(catalog);
  } catch (error) {
    console.error('Error fetching integration catalog:', error);
    res.status(500).json({ error: 'Failed to fetch integration catalog' });
  }
};

export default {
  getIntegrations,
  getIntegration,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  connectIntegration,
  oauthCallback,
  disconnectIntegration,
  testIntegration,
  syncIntegration,
  getSyncLogs,
  getAvailableIntegrations
};
