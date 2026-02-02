import { Router } from 'express';
import * as ddtController from '../controllers/ddt.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', ddtController.getDDTs);
router.get('/:id', ddtController.getDDT);
router.post('/', ddtController.createDDT);
router.put('/:id', ddtController.updateDDT);
router.delete('/:id', ddtController.deleteDDT);

// Status actions
router.post('/:id/ready', ddtController.markReady);
router.post('/:id/ship', ddtController.markInTransit);
router.post('/:id/deliver', ddtController.markDelivered);
router.post('/:id/cancel', ddtController.cancelDDT);

// PDF
router.get('/:id/pdf', ddtController.generatePDF);

export default router;
