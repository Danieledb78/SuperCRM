import { Router } from 'express';
import * as pipelineController from '../controllers/pipeline.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', pipelineController.getPipelines);
router.get('/:id', pipelineController.getPipeline);
router.post('/', pipelineController.createPipeline);
router.put('/:id', pipelineController.updatePipeline);
router.delete('/:id', pipelineController.deletePipeline);

// Stages
router.get('/:id/stages', pipelineController.getStages);
router.post('/:id/stages', pipelineController.createStage);
router.put('/:id/stages/:stageId', pipelineController.updateStage);
router.delete('/:id/stages/:stageId', pipelineController.deleteStage);
router.patch('/:id/stages/reorder', pipelineController.reorderStages);

export default router;
