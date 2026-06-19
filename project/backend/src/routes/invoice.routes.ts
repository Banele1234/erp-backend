import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, invoiceController.getInvoices);
router.get('/:id', authenticate, invoiceController.getInvoiceById);
router.post('/', authenticate, authorize('admin', 'management', 'warehouse_staff'), invoiceController.createInvoice);
router.put('/:id', authenticate, authorize('admin', 'management'), invoiceController.updateInvoice);

export default router;
