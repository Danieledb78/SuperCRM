import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

// Overview stats
router.get('/stats', dashboardController.getStats);
router.get('/sales', dashboardController.getSalesStats);
router.get('/activities', dashboardController.getActivityStats);
router.get('/projects', dashboardController.getProjectStats);

// Recent items
router.get('/recent/contacts', dashboardController.getRecentContacts);
router.get('/recent/deals', dashboardController.getRecentDeals);
router.get('/recent/activities', dashboardController.getRecentActivities);

// Charts data
router.get('/charts/revenue', dashboardController.getRevenueChart);
router.get('/charts/pipeline', dashboardController.getPipelineChart);
router.get('/charts/sources', dashboardController.getLeadSourcesChart);

export default router;
