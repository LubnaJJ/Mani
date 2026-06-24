import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { orderService } from '../services/order.service';
import { AppError } from '../middleware/errorHandler';
import { successResponse } from '../types/api.types';

const createOrderSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Delivery address is required'),
  payment_method: z.enum(['cod', 'bank_transfer']).default('cod'),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid('Invalid product ID'),
        quantity: z.number().int().positive('Quantity must be a positive integer'),
      })
    )
    .min(1, 'Order must contain at least one item'),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
});

const updatePaymentStatusSchema = z.object({
  payment_status: z.enum(['unpaid', 'paid', 'confirmed']),
});

const createCustomOrderSchema = z.object({
  customer_name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  payment_method: z.enum(['cod', 'bank_transfer']).default('cod'),
  custom_spec: z.object({
    bead_colors: z.array(z.string()).min(1, 'Select at least one bead color'),
    charms: z.array(z.string()),
    bead_count: z.number().int().min(16).max(24),
    wrist_size: z.string().min(1, 'Wrist size is required'),
    special_instructions: z.string().optional(),
    preferred_delivery_date: z.string().optional(),
    initial_letter: z.string().optional(),
  }),
});

export const orderController = {
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await orderService.getAllOrders();
      res.json(successResponse(orders));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await orderService.getOrderById(req.params.id);
      res.json(successResponse(order));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        next(new AppError(parsed.error.errors[0].message, 400));
        return;
      }
      const order = await orderService.createOrder(parsed.data);
      res.status(201).json(successResponse(order));
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        next(new AppError(parsed.error.errors[0].message, 400));
        return;
      }
      const order = await orderService.updateOrderStatus(req.params.id, parsed.data.status);
      res.json(successResponse(order));
    } catch (err) {
      next(err);
    }
  },

  async updatePaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updatePaymentStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        next(new AppError(parsed.error.errors[0].message, 400));
        return;
      }
      const order = await orderService.updateOrderPaymentStatus(req.params.id, parsed.data.payment_status);
      res.json(successResponse(order));
    } catch (err) {
      next(err);
    }
  },

  async createCustomOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createCustomOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        next(new AppError(parsed.error.errors[0].message, 400));
        return;
      }
      const order = await orderService.createCustomOrder(parsed.data);
      res.status(201).json(successResponse(order));
    } catch (err) {
      next(err);
    }
  },
};
