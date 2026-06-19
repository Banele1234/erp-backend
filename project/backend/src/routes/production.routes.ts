import { Router } from 'express';
import * as productionController from '../controllers/production.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, productionController.getProduction);
router.post('/', authenticate, authorize('admin', 'management', 'production'), productionController.createProductionBatch);
router.put('/:id', authenticate, authorize('admin', 'management', 'production'), productionController.updateProductionProgress);

export default router;
