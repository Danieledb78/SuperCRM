import { Router } from 'express';
import * as supplierController from '../controllers/supplier.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', supplierController.getSuppliers);
router.get('/:id', supplierController.getSupplier);
router.post('/', supplierController.createSupplier);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

// Products linked to supplier
router.get('/:id/products', supplierController.getSupplierProducts);
router.post('/:id/products', supplierController.linkProduct);
router.delete('/:id/products/:productId', supplierController.unlinkProduct);

// Purchase orders
router.get('/:id/orders', supplierController.getSupplierOrders);

export default router;
