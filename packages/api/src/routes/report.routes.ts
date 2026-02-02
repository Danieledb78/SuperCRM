import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { authenticate, requireOrganization, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

// Reports CRUD
router.get('/', reportController.getReports);
router.get('/:id', reportController.getReport);
router.post('/', authorize('ADMIN', 'CEO', 'COO', 'CFO'), reportController.createReport);
router.put('/:id', authorize('ADMIN', 'CEO', 'COO', 'CFO'), reportController.updateReport);
router.delete('/:id', authorize('ADMIN', 'CEO', 'COO', 'CFO'), reportController.deleteReport);

// Run report
router.post('/:id/run', reportController.runReport);
router.get('/:id/export', reportController.exportReport);

// Pre-built reports
router.get('/prebuilt/sales-summary', reportController.getSalesSummary);
router.get('/prebuilt/pipeline-analysis', reportController.getPipelineAnalysis);
router.get('/prebuilt/revenue-trend', reportController.getRevenueTrend);
router.get('/prebuilt/project-profitability', reportController.getProjectProfitability);
router.get('/prebuilt/supplier-performance', reportController.getSupplierPerformance);
router.get('/prebuilt/inventory-status', reportController.getInventoryStatus);

export default router;
