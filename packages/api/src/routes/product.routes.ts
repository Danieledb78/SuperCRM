import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', productController.getProducts);
router.get('/:id', productController.getProduct);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// Stock
router.get('/:id/stock', productController.getStock);

export default router;
