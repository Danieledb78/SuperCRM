import { Router } from 'express';
import * as tagController from '../controllers/tag.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', tagController.getTags);
router.get('/:id', tagController.getTag);
router.post('/', tagController.createTag);
router.put('/:id', tagController.updateTag);
router.delete('/:id', tagController.deleteTag);

export default router;
