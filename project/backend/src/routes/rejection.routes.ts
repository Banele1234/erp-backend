import { Router } from 'express';
import * as rejectionController from '../controllers/rejection.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, rejectionController.getRejections);
router.post('/', authenticate, rejectionController.createRejection);
router.post('/:id/resolve', authenticate, rejectionController.resolveRejection);

export default router;
