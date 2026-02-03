import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  // Portal Access Management
  getPortalAccesses,
  getPortalAccess,
  createPortalAccess,
  updatePortalAccess,
  revokePortalAccess,
  resendInvitation,
  // Portal Authentication (public)
  portalLogin,
  acceptInvitation,
  portalPasswordReset,
  // Portal Documents
  getPortalDocuments,
  shareDocument,
  removePortalDocument,
  // Portal Messages
  getPortalMessages,
  sendPortalMessage,
  replyFromPortal,
  markMessageRead,
  // Customer Portal
  getCustomerProjects,
  // Supplier Portal
  getSupplierOrders,
  updateDeliveryStatus,
  // Analytics
  getPortalStats
} from '../controllers/portal.controller';

const router = Router();

// ============================================
// PUBLIC PORTAL AUTH ENDPOINTS
// ============================================

// Portal login
router.post('/auth/login', portalLogin);

// Accept invitation and set password
router.post('/auth/accept-invitation', acceptInvitation);

// Password reset request
router.post('/auth/password-reset', portalPasswordReset);

// ============================================
// CRM ADMIN ROUTES (require CRM authentication)
// ============================================

// Portal access management
router.get('/accesses', authenticate, getPortalAccesses);
router.get('/accesses/:id', authenticate, getPortalAccess);
router.post('/accesses', authenticate, createPortalAccess);
router.put('/accesses/:id', authenticate, updatePortalAccess);
router.delete('/accesses/:id', authenticate, revokePortalAccess);
router.post('/accesses/:id/resend-invitation', authenticate, resendInvitation);

// Portal statistics
router.get('/stats', authenticate, getPortalStats);

// Share document with portal user
router.post('/documents/share', authenticate, shareDocument);

// Remove document from portal
router.delete('/accesses/:portalAccessId/documents/:documentId', authenticate, removePortalDocument);

// Get messages for portal access (CRM view)
router.get('/accesses/:portalAccessId/messages', authenticate, getPortalMessages);

// Send message to portal user
router.post('/accesses/:portalAccessId/messages', authenticate, sendPortalMessage);

// ============================================
// PORTAL USER ROUTES (require portal authentication)
// These would use a separate portalAuthenticate middleware
// For now, we use authenticate as placeholder
// ============================================

// Customer portal routes
router.get('/customer/projects', authenticate, getCustomerProjects);
router.get('/customer/documents', authenticate, (req, res) => {
  req.params.portalAccessId = 'current';
  getPortalDocuments(req, res);
});
router.get('/customer/messages', authenticate, (req, res) => {
  req.params.portalAccessId = 'current';
  getPortalMessages(req, res);
});
router.post('/customer/messages', authenticate, (req, res) => {
  req.params.portalAccessId = 'current';
  replyFromPortal(req, res);
});

// Supplier portal routes
router.get('/supplier/orders', authenticate, getSupplierOrders);
router.patch('/supplier/orders/:orderId/delivery', authenticate, updateDeliveryStatus);
router.get('/supplier/documents', authenticate, (req, res) => {
  req.params.portalAccessId = 'current';
  getPortalDocuments(req, res);
});
router.get('/supplier/messages', authenticate, (req, res) => {
  req.params.portalAccessId = 'current';
  getPortalMessages(req, res);
});
router.post('/supplier/messages', authenticate, (req, res) => {
  req.params.portalAccessId = 'current';
  replyFromPortal(req, res);
});

// Common portal routes
router.patch('/messages/:messageId/read', authenticate, markMessageRead);

export default router;
