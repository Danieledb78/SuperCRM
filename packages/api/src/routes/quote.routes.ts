import { Router } from 'express';
import * as quoteController from '../controllers/quote.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', quoteController.getQuotes);
router.get('/:id', quoteController.getQuote);
router.post('/', quoteController.createQuote);
router.put('/:id', quoteController.updateQuote);
router.delete('/:id', quoteController.deleteQuote);

// Actions
router.post('/:id/send', quoteController.sendQuote);
router.post('/:id/convert', quoteController.convertToInvoice);
router.post('/:id/duplicate', quoteController.duplicateQuote);

// PDF
router.get('/:id/pdf', quoteController.generatePDF);

export default router;
