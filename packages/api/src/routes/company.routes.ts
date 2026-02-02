import { Router } from 'express';
import * as companyController from '../controllers/company.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', companyController.getCompanies);
router.get('/:id', companyController.getCompany);
router.post('/', companyController.createCompany);
router.put('/:id', companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);

// Contacts of company
router.get('/:id/contacts', companyController.getCompanyContacts);

export default router;
