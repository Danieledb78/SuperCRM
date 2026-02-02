import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

// CRUD
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Status
router.patch('/:id/status', projectController.updateStatus);

// Kanban Phases
router.get('/:id/phases', projectController.getPhases);
router.post('/:id/phases', projectController.createPhase);
router.put('/:id/phases/:phaseId', projectController.updatePhase);
router.delete('/:id/phases/:phaseId', projectController.deletePhase);
router.patch('/:id/phases/reorder', projectController.reorderPhases);

// Phase Tasks
router.get('/:id/phases/:phaseId/tasks', projectController.getPhaseTasks);
router.post('/:id/phases/:phaseId/tasks', projectController.createPhaseTask);
router.put('/:id/phases/:phaseId/tasks/:taskId', projectController.updatePhaseTask);
router.delete('/:id/phases/:phaseId/tasks/:taskId', projectController.deletePhaseTask);

// Materials
router.get('/:id/materials', projectController.getMaterials);
router.post('/:id/materials', projectController.addMaterial);
router.put('/:id/materials/:materialId', projectController.updateMaterial);
router.delete('/:id/materials/:materialId', projectController.removeMaterial);

// Costs
router.get('/:id/costs', projectController.getCosts);
router.post('/:id/costs', projectController.addCost);
router.put('/:id/costs/:costId', projectController.updateCost);
router.delete('/:id/costs/:costId', projectController.removeCost);
router.get('/:id/costs/summary', projectController.getCostSummary);

// Team
router.get('/:id/team', projectController.getTeam);
router.post('/:id/team', projectController.addTeamMember);
router.put('/:id/team/:memberId', projectController.updateTeamMember);
router.delete('/:id/team/:memberId', projectController.removeTeamMember);

// Work Logs
router.get('/:id/worklogs', projectController.getWorkLogs);
router.post('/:id/worklogs', projectController.addWorkLog);
router.put('/:id/worklogs/:logId', projectController.updateWorkLog);
router.delete('/:id/worklogs/:logId', projectController.removeWorkLog);

// Documents
router.get('/:id/documents', projectController.getDocuments);
router.post('/:id/documents', projectController.uploadDocument);
router.delete('/:id/documents/:docId', projectController.removeDocument);

// Dashboard/Stats for single project
router.get('/:id/stats', projectController.getProjectStats);
router.get('/:id/timeline', projectController.getTimeline);

export default router;
