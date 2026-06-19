import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/stats', authenticate, authorize('admin', 'management'), dashboardController.getDashboardStats);
router.get('/customer', authenticate, dashboardController.getCustomerDashboard);
router.get('/sales-chart', authenticate, authorize('admin', 'management'), dashboardController.getSalesChartData);
router.get('/top-products', authenticate, authorize('admin', 'management'), dashboardController.getTopProducts);

export default router;
