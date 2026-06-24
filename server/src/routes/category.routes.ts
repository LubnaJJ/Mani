import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { requireAdmin } from '../middleware/auth.middleware';

export const categoryRouter = Router();

categoryRouter.get('/', categoryController.getAll);
categoryRouter.get('/:id', categoryController.getById);
categoryRouter.post('/', requireAdmin, categoryController.create);
categoryRouter.put('/:id', requireAdmin, categoryController.update);
categoryRouter.delete('/:id', requireAdmin, categoryController.remove);
