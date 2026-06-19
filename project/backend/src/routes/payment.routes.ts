import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, paymentController.getPayments);
router.post('/', authenticate, authorize('admin', 'management'), paymentController.createPayment);

export default router;
