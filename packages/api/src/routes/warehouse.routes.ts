import { Router } from 'express';
import * as warehouseController from '../controllers/warehouse.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

// Warehouses
router.get('/', warehouseController.getWarehouses);
router.get('/:id', warehouseController.getWarehouse);
router.post('/', warehouseController.createWarehouse);
router.put('/:id', warehouseController.updateWarehouse);
router.delete('/:id', warehouseController.deleteWarehouse);

// Stock
router.get('/:id/stock', warehouseController.getWarehouseStock);
router.get('/stock/all', warehouseController.getAllStock);
router.get('/stock/low', warehouseController.getLowStock);

// Movements
router.get('/movements', warehouseController.getMovements);
router.post('/movements', warehouseController.createMovement);
router.get('/movements/:id', warehouseController.getMovement);

// Transfer between warehouses
router.post('/transfer', warehouseController.transferStock);

export default router;
