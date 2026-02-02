import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as integrationController from '../controllers/integration.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// INTEGRATION CATALOG
// ============================================

// Get available integrations (public catalog)
router.get('/catalog', integrationController.getAvailableIntegrations);

// ============================================
// INTEGRATIONS CRUD
// ============================================

// Get all integrations for organization
router.get('/', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), integrationController.getIntegrations);

// Get single integration
router.get('/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), integrationController.getIntegration);

// Create new integration
router.post('/', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), integrationController.createIntegration);

// Update integration
router.put('/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), integrationController.updateIntegration);

// Delete integration
router.delete('/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO']), integrationController.deleteIntegration);

// ============================================
// CONNECTION MANAGEMENT
// ============================================

// Connect/authenticate integration
router.post('/:id/connect', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), integrationController.connectIntegration);

// OAuth callback (no auth required)
router.get('/oauth/callback', integrationController.oauthCallback);

// Disconnect integration
router.post('/:id/disconnect', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), integrationController.disconnectIntegration);

// Test integration connection
router.post('/:id/test', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), integrationController.testIntegration);

// ============================================
// SYNC OPERATIONS
// ============================================

// Trigger manual sync
router.post('/:id/sync', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), integrationController.syncIntegration);

// Get sync logs
router.get('/:id/sync-logs', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), integrationController.getSyncLogs);

export default router;
