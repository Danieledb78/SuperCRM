import { Router } from 'express';
import * as purchaseOrderController from '../controllers/purchaseorder.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', purchaseOrderController.getPurchaseOrders);
router.get('/:id', purchaseOrderController.getPurchaseOrder);
router.post('/', purchaseOrderController.createPurchaseOrder);
router.put('/:id', purchaseOrderController.updatePurchaseOrder);
router.delete('/:id', purchaseOrderController.deletePurchaseOrder);

// Status actions
router.post('/:id/send', purchaseOrderController.sendOrder);
router.post('/:id/confirm', purchaseOrderController.confirmOrder);
router.post('/:id/receive', purchaseOrderController.receiveOrder);
router.post('/:id/cancel', purchaseOrderController.cancelOrder);

// Partial receipt
router.post('/:id/receive-partial', purchaseOrderController.receivePartial);

// PDF
router.get('/:id/pdf', purchaseOrderController.generatePDF);

export default router;
