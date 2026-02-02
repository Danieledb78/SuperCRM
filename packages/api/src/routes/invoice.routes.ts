import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoice);
router.post('/', invoiceController.createInvoice);
router.put('/:id', invoiceController.updateInvoice);
router.delete('/:id', invoiceController.deleteInvoice);

// Actions
router.post('/:id/send', invoiceController.sendInvoice);
router.post('/:id/payments', invoiceController.addPayment);
router.delete('/:id/payments/:paymentId', invoiceController.removePayment);

// PDF & XML
router.get('/:id/pdf', invoiceController.generatePDF);
router.get('/:id/xml', invoiceController.generateXML); // Fattura elettronica

export default router;
