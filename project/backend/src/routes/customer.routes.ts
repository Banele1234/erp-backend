import { Router } from 'express';
import * as customerController from '../controllers/customer.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, authorize('admin', 'management'), customerController.getCustomers);
router.get('/:id', authenticate, customerController.getCustomerById);
router.post('/', authenticate, authorize('admin', 'management'), customerController.createCustomer);
router.put('/:id', authenticate, authorize('admin', 'management'), customerController.updateCustomer);
router.delete('/:id', authenticate, authorize('admin'), customerController.deleteCustomer);
router.get('/:id/orders', authenticate, customerController.getCustomerOrders);
router.put('/:id/rating', authenticate, authorize('admin', 'management'), customerController.updateCustomerRating);

export default router;
