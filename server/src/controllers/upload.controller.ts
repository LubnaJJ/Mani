import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { uploadService } from '../services/upload.service';
import { AppError } from '../middleware/errorHandler';
import { successResponse } from '../types/api.types';

const productImageBodySchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  is_primary: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((v) => v === 'true'),
});

const paymentSlipBodySchema = z.object({
  order_id: z.string().uuid('Invalid order ID'),
});

export const uploadController = {
  async uploadProductImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('[upload] req.file:', req.file);
      if (!req.file) {
        next(new AppError('Image file is required', 400));
        return;
      }
      const parsed = productImageBodySchema.safeParse(req.body);
      if (!parsed.success) {
        next(new AppError(parsed.error.errors[0].message, 400));
        return;
      }
      const image = await uploadService.uploadProductImage(
        parsed.data.product_id,
        req.file.buffer,
        parsed.data.is_primary
      );
      res.status(201).json(successResponse(image));
    } catch (err) {
      next(err);
    }
  },

  async uploadPaymentSlip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        next(new AppError('Payment slip image is required', 400));
        return;
      }
      const parsed = paymentSlipBodySchema.safeParse(req.body);
      if (!parsed.success) {
        next(new AppError(parsed.error.errors[0].message, 400));
        return;
      }
      const slip = await uploadService.uploadPaymentSlip(
        parsed.data.order_id,
        req.file.buffer
      );
      res.status(201).json(successResponse(slip));
    } catch (err) {
      next(err);
    }
  },
};
