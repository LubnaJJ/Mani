import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { productService } from '../services/product.service';
import { productRepository } from '../repositories/product.repository';
import { AppError } from '../middleware/errorHandler';
import { successResponse } from '../types/api.types';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
  category_id: z.string().uuid('Invalid category ID'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  is_visible: z.boolean().default(true),
});

const setImagePrimarySchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
});

const updateSchema = z
  .object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    description: z.string().min(1, 'Description cannot be empty').optional(),
    price: z.number().positive('Price must be positive').optional(),
    category_id: z.string().uuid('Invalid category ID').optional(),
    stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
    is_visible: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'At least one field must be provided',
  });

export const productController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId =
        typeof req.query.category_id === 'string' ? req.query.category_id : undefined;
      const products = await productService.getAllVisibleProducts(categoryId);
      res.json(successResponse(products));
    } catch (err) {
      next(err);
    }
  },

  async getAllAdmin(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await productService.getAllProducts();
      res.json(successResponse(products));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.getProductById(req.params.id);
      res.json(successResponse(product));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        next(new AppError(parsed.error.errors[0].message, 400));
        return;
      }
      const product = await productService.createProduct(parsed.data);
      res.status(201).json(successResponse(product));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        next(new AppError(parsed.error.errors[0].message, 400));
        return;
      }
      const product = await productService.updateProduct(req.params.id, parsed.data);
      res.json(successResponse(product));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await productService.deleteProduct(req.params.id);
      res.json(successResponse({ id: req.params.id }));
    } catch (err) {
      next(err);
    }
  },

  async setImagePrimary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = setImagePrimarySchema.safeParse(req.body);
      if (!parsed.success) {
        next(new AppError(parsed.error.errors[0].message, 400));
        return;
      }
      await productRepository.setImagePrimary(req.params.imageId, parsed.data.product_id);
      res.json(successResponse({ imageId: req.params.imageId }));
    } catch (err) {
      next(err);
    }
  },

  async removeImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await productRepository.removeImage(req.params.imageId);
      res.json(successResponse({ imageId: req.params.imageId }));
    } catch (err) {
      next(err);
    }
  },
};
