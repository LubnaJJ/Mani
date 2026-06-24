import { Router } from 'express';
import multer from 'multer';
import { uploadController } from '../controllers/upload.controller';
import { requireAdmin } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';

export const uploadRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed', 415));
    }
  },
});

uploadRouter.post(
  '/product-image',
  requireAdmin,
  upload.single('image'),
  uploadController.uploadProductImage
);
uploadRouter.post('/payment-slip', upload.single('image'), uploadController.uploadPaymentSlip);
