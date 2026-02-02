import { Router } from 'express';
import * as contactController from '../controllers/contact.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', contactController.getContacts);
router.get('/:id', contactController.getContact);
router.post('/', contactController.createContact);
router.put('/:id', contactController.updateContact);
router.delete('/:id', contactController.deleteContact);

// Tags
router.post('/:id/tags', contactController.addTags);
router.delete('/:id/tags/:tagId', contactController.removeTag);

// Notes & Activities
router.get('/:id/activities', contactController.getActivities);
router.get('/:id/notes', contactController.getNotes);

export default router;
