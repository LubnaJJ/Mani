import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return next(new AppError('Unauthorized', 401));
  }

  const base64 = authHeader.split(' ')[1];
  const [username, password] = Buffer.from(base64, 'base64').toString().split(':');

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return next(new AppError('Invalid credentials', 401));
  }

  next();
};
