import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { categoryService } from '../services/category.service';
import { AppError } from '../middleware/errorHandler';
import { successResponse } from '../types/api.types';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(slugRegex, 'Slug must be lowercase alphanumeric words separated by hyphens'),
});

const updateSchema = z
  .object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    slug: z
      .string()
      .min(1, 'Slug cannot be empty')
      .regex(slugRegex, 'Slug must be lowercase alphanumeric words separated by hyphens')
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.slug !== undefined, {
    message: 'At least one field (name or slug) must be provided',
  });

export const categoryController = {
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await categoryService.getAllCategories();
      res.json(successResponse(categories));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      res.json(successResponse(category));
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
      const category = await categoryService.createCategory(
        parsed.data.name,
        parsed.data.slug
      );
      res.status(201).json(successResponse(category));
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
      const category = await categoryService.updateCategory(req.params.id, parsed.data);
      res.json(successResponse(category));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await categoryService.deleteCategory(req.params.id);
      res.json(successResponse({ id: req.params.id }));
    } catch (err) {
      next(err);
    }
  },
};
