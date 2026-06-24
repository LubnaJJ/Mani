import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../types/api.types';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal server error';
  console.error(`[Error] ${statusCode}: ${message}`);
  res.status(statusCode).json(errorResponse(message));
};
