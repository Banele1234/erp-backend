import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Admin/Management routes
router.get('/stats', authenticate, authorize('admin', 'management'), dashboardController.getDashboardStats);
router.get('/sales-chart', authenticate, authorize('admin', 'management'), dashboardController.getSalesChartData);
router.get('/top-products', authenticate, authorize('admin', 'management'), dashboardController.getTopProducts);

// Customer route (any authenticated user)
router.get('/customer', authenticate, dashboardController.getCustomerDashboard);

export default router;