import { Router } from 'express';
import * as automationController from '../controllers/automation.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', automationController.getAutomations);
router.get('/:id', automationController.getAutomation);
router.post('/', automationController.createAutomation);
router.put('/:id', automationController.updateAutomation);
router.delete('/:id', automationController.deleteAutomation);

// Actions
router.patch('/:id/activate', automationController.activateAutomation);
router.patch('/:id/deactivate', automationController.deactivateAutomation);
router.post('/:id/trigger', automationController.triggerAutomation);

// Logs
router.get('/:id/logs', automationController.getAutomationLogs);

export default router;
