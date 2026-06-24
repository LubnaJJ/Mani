import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { requireAdmin } from '../middleware/auth.middleware';

export const productRouter = Router();

productRouter.get('/', productController.getAll);
productRouter.get('/admin', requireAdmin, productController.getAllAdmin);
// Image management — registered before /:id so 'images' is not captured as a product id
productRouter.patch('/images/:imageId/primary', requireAdmin, productController.setImagePrimary);
productRouter.delete('/images/:imageId', requireAdmin, productController.removeImage);
productRouter.get('/:id', productController.getById);
productRouter.post('/', requireAdmin, productController.create);
productRouter.put('/:id', requireAdmin, productController.update);
productRouter.delete('/:id', requireAdmin, productController.remove);
