import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, inventoryController.getInventory);
router.post('/adjust', authenticate, authorize('admin', 'management', 'warehouse_staff'), inventoryController.adjustInventory);
router.get('/movements', authenticate, inventoryController.getInventoryMovements);

export default router;
