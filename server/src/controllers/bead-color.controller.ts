import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { beadColorService } from '../services/bead-color.service';
import { AppError } from '../middleware/errorHandler';
import { successResponse } from '../types/api.types';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  hex_code: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex colour e.g. #B5837A'),
  is_available: z.boolean().default(true),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  hex_code: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex colour e.g. #B5837A').optional(),
  is_available: z.boolean().optional(),
});

export const beadColorController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const onlyAvailable = req.query.available === 'true';
      const colors = await beadColorService.getAll(onlyAvailable);
      res.json(successResponse(colors));
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
      const color = await beadColorService.create(parsed.data);
      res.status(201).json(successResponse(color));
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
      const color = await beadColorService.update(req.params.id, parsed.data);
      res.json(successResponse(color));
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await beadColorService.delete(req.params.id);
      res.json(successResponse(null));
    } catch (err) {
      next(err);
    }
  },
};
