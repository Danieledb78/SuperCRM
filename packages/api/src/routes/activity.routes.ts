import { Router } from 'express';
import * as activityController from '../controllers/activity.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', activityController.getActivities);
router.get('/:id', activityController.getActivity);
router.post('/', activityController.createActivity);
router.put('/:id', activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);

// Complete activity
router.patch('/:id/complete', activityController.completeActivity);

export default router;
