import { Router } from 'express';
import { beadColorController } from '../controllers/bead-color.controller';
import { requireAdmin } from '../middleware/auth.middleware';

export const beadColorRouter = Router();

beadColorRouter.get('/', beadColorController.getAll);
beadColorRouter.post('/', requireAdmin, beadColorController.create);
beadColorRouter.put('/:id', requireAdmin, beadColorController.update);
beadColorRouter.delete('/:id', requireAdmin, beadColorController.delete);
