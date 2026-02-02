import { Router } from 'express';
import * as documentController from '../controllers/document.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

// Generate PDFs
router.post('/generate/quote/:id', documentController.generateQuotePDF);
router.post('/generate/invoice/:id', documentController.generateInvoicePDF);
router.post('/generate/ddt/:id', documentController.generateDDTPDF);
router.post('/generate/purchase-order/:id', documentController.generatePurchaseOrderPDF);
router.post('/generate/project-report/:id', documentController.generateProjectReportPDF);
router.post('/generate/offer/:id', documentController.generateOfferPDF);

// Generated documents history
router.get('/history', documentController.getGeneratedDocuments);
router.get('/history/:id', documentController.getGeneratedDocument);
router.delete('/history/:id', documentController.deleteGeneratedDocument);

// Download
router.get('/download/:id', documentController.downloadDocument);

export default router;
