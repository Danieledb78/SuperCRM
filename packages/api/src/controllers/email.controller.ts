import { Request, Response } from 'express';

// Email Controller - Integrazione Outlook/Gmail
// Gestisce sincronizzazione email e collegamento automatico con clienti

// ============================================
// EMAIL ACCOUNTS
// ============================================

// Get all connected email accounts
export const getEmailAccounts = async (req: Request, res: Response) => {
  try {
    const { organizationId, id: userId } = req.user!;
    const { includeShared } = req.query;

    // Return user's email accounts and optionally shared accounts
    res.json({
      data: [],
      total: 0
    });
  } catch (error) {
    console.error('Error fetching email accounts:', error);
    res.status(500).json({ error: 'Failed to fetch email accounts' });
  }
};

// Get single email account
export const getEmailAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    res.json({
      id,
      email: '',
      provider: 'OUTLOOK',
      status: 'connected',
      syncEnabled: true,
      lastSyncAt: new Date()
    });
  } catch (error) {
    console.error('Error fetching email account:', error);
    res.status(500).json({ error: 'Failed to fetch email account' });
  }
};

// Connect email account (initiate OAuth)
export const connectEmailAccount = async (req: Request, res: Response) => {
  try {
    const { organizationId, id: userId } = req.user!;
    const { provider } = req.body;

    let authUrl = '';

    if (provider === 'OUTLOOK') {
      // Microsoft OAuth2 configuration
      const clientId = process.env.MICROSOFT_CLIENT_ID;
      const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/api/email/oauth/callback';
      const scopes = [
        'openid',
        'profile',
        'email',
        'offline_access',
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Mail.Send',
        'https://graph.microsoft.com/Mail.ReadWrite',
        'https://graph.microsoft.com/User.Read'
      ].join(' ');

      authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `state=${organizationId}:${userId}&` +
        `prompt=consent`;
    } else if (provider === 'GMAIL') {
      // Google OAuth2 configuration
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/email/oauth/callback';
      const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' ');

      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `state=${organizationId}:${userId}&` +
        `access_type=offline&` +
        `prompt=consent`;
    } else {
      return res.status(400).json({ error: 'Invalid email provider' });
    }

    res.json({
      authUrl,
      provider,
      message: 'Redirect user to authUrl to complete authentication'
    });
  } catch (error) {
    console.error('Error connecting email account:', error);
    res.status(500).json({ error: 'Failed to connect email account' });
  }
};

// OAuth callback handler
export const oauthCallback = async (req: Request, res: Response) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(`/settings/integrations?error=${oauthError}`);
    }

    // Parse state to get organizationId and userId
    const [organizationId, userId] = (state as string).split(':');

    // Determine provider based on the callback source
    // In a real implementation, you'd store this in the state

    // Exchange code for tokens
    // For Microsoft:
    // POST https://login.microsoftonline.com/common/oauth2/v2.0/token
    // For Google:
    // POST https://oauth2.googleapis.com/token

    // Store tokens encrypted in database
    // Create EmailAccount record
    // Start initial sync

    res.redirect('/settings/integrations?success=email_connected');
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.redirect('/settings/integrations?error=oauth_failed');
  }
};

// Disconnect email account
export const disconnectEmailAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Revoke tokens
    // Delete email account and synced emails

    res.json({
      success: true,
      message: 'Email account disconnected'
    });
  } catch (error) {
    console.error('Error disconnecting email account:', error);
    res.status(500).json({ error: 'Failed to disconnect email account' });
  }
};

// Update email account settings
export const updateEmailAccountSettings = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { syncEnabled, syncFrequency, syncFolders, autoLinkEnabled, autoLinkRules } = req.body;

    res.json({
      id,
      syncEnabled,
      syncFrequency,
      syncFolders,
      autoLinkEnabled,
      autoLinkRules,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating email account settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// ============================================
// EMAIL SYNC
// ============================================

// Trigger manual email sync
export const syncEmails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fullSync = false } = req.body;

    // Start sync job in background
    // For Microsoft Graph API:
    // GET https://graph.microsoft.com/v1.0/me/messages
    // For Gmail API:
    // GET https://gmail.googleapis.com/gmail/v1/users/me/messages

    res.json({
      message: fullSync ? 'Full sync started' : 'Incremental sync started',
      syncId: `sync_${Date.now()}`
    });
  } catch (error) {
    console.error('Error syncing emails:', error);
    res.status(500).json({ error: 'Failed to sync emails' });
  }
};

// Get sync status
export const getSyncStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    res.json({
      status: 'idle', // running, idle, error
      lastSyncAt: new Date(),
      emailsProcessed: 0,
      emailsLinked: 0,
      nextSyncAt: new Date(Date.now() + 5 * 60 * 1000)
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
};

// ============================================
// EMAILS
// ============================================

// Get emails with filters
export const getEmails = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const {
      accountId,
      folderId,
      linkedContactId,
      linkedCompanyId,
      linkedDealId,
      linkedProjectId,
      unlinked,
      isRead,
      isStarred,
      search,
      page = 1,
      pageSize = 50
    } = req.query;

    // Build filters and fetch from database
    const filters: any = { organizationId };
    if (accountId) filters.emailAccountId = accountId;
    if (folderId) filters.folderId = folderId;
    if (linkedContactId) filters.linkedContactId = linkedContactId;
    if (linkedCompanyId) filters.linkedCompanyId = linkedCompanyId;
    if (linkedDealId) filters.linkedDealId = linkedDealId;
    if (linkedProjectId) filters.linkedProjectId = linkedProjectId;
    if (unlinked === 'true') {
      filters.linkedContactId = null;
      filters.linkedCompanyId = null;
    }
    if (isRead !== undefined) filters.isRead = isRead === 'true';
    if (isStarred !== undefined) filters.isStarred = isStarred === 'true';

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
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
};

// Get single email
export const getEmail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    res.json({
      id,
      subject: '',
      bodyPreview: '',
      bodyHtml: '',
      fromAddress: '',
      fromName: '',
      toAddresses: [],
      receivedAt: new Date(),
      linkedContact: null,
      linkedCompany: null,
      attachments: []
    });
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
};

// Get email thread
export const getEmailThread = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    res.json({
      threadId: '',
      messages: [],
      participantCount: 0,
      messageCount: 0
    });
  } catch (error) {
    console.error('Error fetching email thread:', error);
    res.status(500).json({ error: 'Failed to fetch email thread' });
  }
};

// ============================================
// EMAIL LINKING
// ============================================

// Link email to contact/company/deal/project
export const linkEmail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { contactId, companyId, dealId, projectId } = req.body;

    // Update email with linked entities
    res.json({
      id,
      linkedContactId: contactId || null,
      linkedCompanyId: companyId || null,
      linkedDealId: dealId || null,
      linkedProjectId: projectId || null,
      manuallyLinked: true,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error linking email:', error);
    res.status(500).json({ error: 'Failed to link email' });
  }
};

// Unlink email
export const unlinkEmail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // contact, company, deal, project, all

    res.json({
      id,
      message: `Unlinked from ${type || 'all'}`,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error unlinking email:', error);
    res.status(500).json({ error: 'Failed to unlink email' });
  }
};

// Auto-link unlinked emails
export const autoLinkEmails = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { accountId, dryRun = false } = req.body;

    // Find unlinked emails
    // Match email addresses with contacts/companies
    // Link with confidence score

    const results = {
      processed: 0,
      linked: 0,
      skipped: 0,
      suggestions: [] as any[] // For dry run
    };

    // Auto-link logic:
    // 1. Get all unlinked emails
    // 2. For each email, check fromAddress and toAddresses
    // 3. Find contacts/companies with matching email
    // 4. Link with confidence score based on match type

    res.json({
      ...results,
      dryRun
    });
  } catch (error) {
    console.error('Error auto-linking emails:', error);
    res.status(500).json({ error: 'Failed to auto-link emails' });
  }
};

// Get link suggestions for an email
export const getLinkSuggestions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Analyze email and suggest possible links
    const suggestions = {
      contacts: [],  // Contacts with matching email
      companies: [], // Companies with matching domain
      deals: [],     // Open deals with matched contact/company
      projects: []   // Active projects with matched contact/company
    };

    res.json(suggestions);
  } catch (error) {
    console.error('Error getting link suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
};

// ============================================
// EMAIL ACTIONS
// ============================================

// Mark email as read/unread
export const markEmailRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body;

    // Update locally and sync with provider
    res.json({
      id,
      isRead,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error marking email:', error);
    res.status(500).json({ error: 'Failed to mark email' });
  }
};

// Star/unstar email
export const starEmail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isStarred } = req.body;

    res.json({
      id,
      isStarred,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error starring email:', error);
    res.status(500).json({ error: 'Failed to star email' });
  }
};

// Send email reply (through provider)
export const sendReply = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { body, attachments } = req.body;

    // Send through Microsoft Graph or Gmail API
    res.json({
      success: true,
      message: 'Reply sent'
    });
  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
};

// Compose new email
export const composeEmail = async (req: Request, res: Response) => {
  try {
    const { accountId, to, cc, bcc, subject, body, attachments, contextType, contextId } = req.body;

    // Send through provider API
    // Link to context if provided

    res.json({
      success: true,
      message: 'Email sent'
    });
  } catch (error) {
    console.error('Error composing email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

// ============================================
// FOLDERS
// ============================================

// Get email folders
export const getEmailFolders = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;

    res.json({
      data: [
        { id: 'inbox', name: 'Inbox', type: 'inbox', unreadCount: 0 },
        { id: 'sent', name: 'Sent', type: 'sent', unreadCount: 0 },
        { id: 'drafts', name: 'Drafts', type: 'drafts', unreadCount: 0 },
        { id: 'trash', name: 'Trash', type: 'trash', unreadCount: 0 }
      ]
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
};

// Sync folders from provider
export const syncFolders = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;

    res.json({
      success: true,
      foldersUpdated: 0
    });
  } catch (error) {
    console.error('Error syncing folders:', error);
    res.status(500).json({ error: 'Failed to sync folders' });
  }
};

// ============================================
// STATISTICS
// ============================================

// Get email statistics
export const getEmailStats = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { accountId, period = '30d' } = req.query;

    res.json({
      totalEmails: 0,
      linkedEmails: 0,
      unlinkedEmails: 0,
      receivedToday: 0,
      sentToday: 0,
      topContacts: [],
      emailsByDay: [],
      linkingRate: 0 // percentage
    });
  } catch (error) {
    console.error('Error getting email stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};

export default {
  getEmailAccounts,
  getEmailAccount,
  connectEmailAccount,
  oauthCallback,
  disconnectEmailAccount,
  updateEmailAccountSettings,
  syncEmails,
  getSyncStatus,
  getEmails,
  getEmail,
  getEmailThread,
  linkEmail,
  unlinkEmail,
  autoLinkEmails,
  getLinkSuggestions,
  markEmailRead,
  starEmail,
  sendReply,
  composeEmail,
  getEmailFolders,
  syncFolders,
  getEmailStats
};
