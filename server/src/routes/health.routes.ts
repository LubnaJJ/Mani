import { Router, Request, Response } from 'express';
import { successResponse } from '../types/api.types';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.json(successResponse({ status: 'ok', timestamp: new Date().toISOString() }));
});
