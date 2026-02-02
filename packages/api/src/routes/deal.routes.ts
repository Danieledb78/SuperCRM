import { Router } from 'express';
import * as dealController from '../controllers/deal.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', dealController.getDeals);
router.get('/:id', dealController.getDeal);
router.post('/', dealController.createDeal);
router.put('/:id', dealController.updateDeal);
router.delete('/:id', dealController.deleteDeal);

// Stage changes
router.patch('/:id/stage', dealController.updateStage);

export default router;
