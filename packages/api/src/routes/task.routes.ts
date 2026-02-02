import { Router } from 'express';
import * as taskController from '../controllers/task.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTask);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Status update
router.patch('/:id/status', taskController.updateStatus);
router.patch('/:id/complete', taskController.completeTask);

export default router;
