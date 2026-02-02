import { Router } from 'express';
import * as templateController from '../controllers/template.controller.js';
import { authenticate, requireOrganization, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

// Document Templates CRUD
router.get('/', templateController.getTemplates);
router.get('/:id', templateController.getTemplate);
router.post('/', authorize('ADMIN', 'CEO'), templateController.createTemplate);
router.put('/:id', authorize('ADMIN', 'CEO'), templateController.updateTemplate);
router.delete('/:id', authorize('ADMIN', 'CEO'), templateController.deleteTemplate);

// Template preview
router.post('/:id/preview', templateController.previewTemplate);

// Default templates
router.post('/init-defaults', authorize('ADMIN', 'CEO'), templateController.initDefaultTemplates);

// Get available variables for a template type
router.get('/variables/:type', templateController.getTemplateVariables);

export default router;
