import { Router } from 'express';
import * as warehouseController from '../controllers/warehouse.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, warehouseController.getWarehouses);
router.get('/:id', authenticate, warehouseController.getWarehouseById);
router.post('/', authenticate, authorize('admin', 'management'), warehouseController.createWarehouse);
router.put('/:id', authenticate, authorize('admin', 'management'), warehouseController.updateWarehouse);
router.get('/:id/inventory', authenticate, warehouseController.getWarehouseInventory);

export default router;
