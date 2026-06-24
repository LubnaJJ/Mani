import { Router } from 'express';
import { charmController } from '../controllers/charm.controller';
import { requireAdmin } from '../middleware/auth.middleware';

export const charmRouter = Router();

charmRouter.get('/', charmController.getAll);
charmRouter.post('/', requireAdmin, charmController.create);
charmRouter.put('/:id', requireAdmin, charmController.update);
charmRouter.delete('/:id', requireAdmin, charmController.delete);
