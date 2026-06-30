import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, productController.getProducts);
router.get('/:id', authenticate, productController.getProductById);
router.post('/', authenticate, authorize('admin', 'management'), productController.createProduct);
router.put('/:id', authenticate, authorize('admin', 'management'), productController.updateProduct);
router.delete('/:id', authenticate, authorize('admin'), productController.deleteProduct);
router.get('/:id/inventory', authenticate, productController.getProductInventory);

export default router;
