import { Router } from 'express';
import * as campaignController from '../controllers/campaign.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', campaignController.getCampaigns);
router.get('/:id', campaignController.getCampaign);
router.post('/', campaignController.createCampaign);
router.put('/:id', campaignController.updateCampaign);
router.delete('/:id', campaignController.deleteCampaign);

// Campaign actions
router.post('/:id/schedule', campaignController.scheduleCampaign);
router.post('/:id/send', campaignController.sendCampaign);
router.post('/:id/pause', campaignController.pauseCampaign);
router.post('/:id/cancel', campaignController.cancelCampaign);

// Stats
router.get('/:id/stats', campaignController.getCampaignStats);

export default router;
