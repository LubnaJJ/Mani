import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { requireAdmin } from '../middleware/auth.middleware';

export const orderRouter = Router();

orderRouter.post('/', orderController.create);
orderRouter.post('/custom', orderController.createCustomOrder);
orderRouter.get('/', requireAdmin, orderController.getAll);
orderRouter.get('/:id', orderController.getById);
orderRouter.patch('/:id/status', requireAdmin, orderController.updateStatus);
orderRouter.patch('/:id/payment-status', requireAdmin, orderController.updatePaymentStatus);
