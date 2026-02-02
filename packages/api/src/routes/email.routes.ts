import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as emailController from '../controllers/email.controller';

const router = Router();

// OAuth callback - no auth required (external redirect)
router.get('/oauth/callback', emailController.oauthCallback);

// All other routes require authentication
router.use(authenticate);

// ============================================
// EMAIL ACCOUNTS
// ============================================

// Get all email accounts
router.get('/accounts', emailController.getEmailAccounts);

// Get single email account
router.get('/accounts/:id', emailController.getEmailAccount);

// Connect new email account (initiate OAuth)
router.post('/accounts/connect', emailController.connectEmailAccount);

// Disconnect email account
router.delete('/accounts/:id', emailController.disconnectEmailAccount);

// Update email account settings
router.put('/accounts/:id/settings', emailController.updateEmailAccountSettings);

// ============================================
// EMAIL SYNC
// ============================================

// Trigger manual sync
router.post('/accounts/:id/sync', emailController.syncEmails);

// Get sync status
router.get('/accounts/:id/sync-status', emailController.getSyncStatus);

// ============================================
// FOLDERS
// ============================================

// Get email folders
router.get('/accounts/:accountId/folders', emailController.getEmailFolders);

// Sync folders
router.post('/accounts/:accountId/folders/sync', emailController.syncFolders);

// ============================================
// EMAILS
// ============================================

// Get emails with filters
router.get('/', emailController.getEmails);

// Get single email
router.get('/:id', emailController.getEmail);

// Get email thread
router.get('/:id/thread', emailController.getEmailThread);

// ============================================
// EMAIL LINKING
// ============================================

// Link email to entity
router.post('/:id/link', emailController.linkEmail);

// Unlink email
router.delete('/:id/link', emailController.unlinkEmail);

// Auto-link emails
router.post('/auto-link', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'COO', 'CTO', 'SALES_DIRECTOR', 'SALES_MANAGER']), emailController.autoLinkEmails);

// Get link suggestions for email
router.get('/:id/link-suggestions', emailController.getLinkSuggestions);

// ============================================
// EMAIL ACTIONS
// ============================================

// Mark email as read/unread
router.post('/:id/read', emailController.markEmailRead);

// Star/unstar email
router.post('/:id/star', emailController.starEmail);

// Send reply
router.post('/:id/reply', emailController.sendReply);

// Compose new email
router.post('/compose', emailController.composeEmail);

// ============================================
// STATISTICS
// ============================================

// Get email statistics
router.get('/stats/summary', emailController.getEmailStats);

export default router;
