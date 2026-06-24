import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.get('/', authenticate, orderController.getOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.post('/', authenticate, orderController.createOrder);
router.put('/:id/status', authenticate, orderController.updateOrderStatus);
router.post('/:id/cancel', authenticate, orderController.cancelOrder); // ✅ No authorize – handled in controller

export default router;