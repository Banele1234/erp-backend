import { Router } from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, authorize('admin'), userController.getUsers);
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name').notEmpty().withMessage('Full name required'),
    body('role').isIn(['admin', 'management', 'warehouse_staff', 'production']).withMessage('Invalid role'),
  ],
  userController.createInternalUser,
);

export default router;
