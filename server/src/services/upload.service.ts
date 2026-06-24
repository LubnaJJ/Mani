import { cloudinary } from '../config/cloudinary';
import { productRepository } from '../repositories/product.repository';
import { orderRepository } from '../repositories/order.repository';
import { AppError } from '../middleware/errorHandler';
import { ProductImage, PaymentSlip } from '../types/models.types';

const uploadBuffer = (buffer: Buffer, folder: string): Promise<string> =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: 'image' }, (error, result) => {
        if (error) return reject(new Error(error.message));
        if (!result) return reject(new Error('Cloudinary returned no result'));
        resolve(result.secure_url);
      })
      .end(buffer);
  });

export const uploadService = {
  async uploadProductImage(
    productId: string,
    buffer: Buffer,
    isPrimary: boolean
  ): Promise<ProductImage> {
    const product = await productRepository.findById(productId);
    if (!product) throw new AppError('Product not found', 404);

    const cloudinaryUrl = await uploadBuffer(buffer, 'mani-jewellery/products');
    return productRepository.addImage(productId, cloudinaryUrl, isPrimary);
  },

  async uploadPaymentSlip(orderId: string, buffer: Buffer): Promise<PaymentSlip> {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);

    const cloudinaryUrl = await uploadBuffer(buffer, 'mani-jewellery/payment-slips');
    return orderRepository.addPaymentSlip(orderId, cloudinaryUrl);
  },
};
