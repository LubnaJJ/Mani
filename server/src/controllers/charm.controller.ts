import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { charmService } from '../services/charm.service';
import { AppError } from '../middleware/errorHandler';
import { successResponse } from '../types/api.types';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  icon_svg: z.string().min(1, 'Icon SVG is required'),
  is_available: z.boolean().default(true),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  icon_svg: z.string().min(1).optional(),
  is_available: z.boolean().optional(),
});

export const charmController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const onlyAvailable = req.query.available === 'true';
      const charms = await charmService.getAll(onlyAvailable);
      res.json(successResponse(charms));
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
      const charm = await charmService.create(parsed.data);
      res.status(201).json(successResponse(charm));
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
      const charm = await charmService.update(req.params.id, parsed.data);
      res.json(successResponse(charm));
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await charmService.delete(req.params.id);
      res.json(successResponse(null));
    } catch (err) {
      next(err);
    }
  },
};
