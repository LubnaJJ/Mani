import { productRepository, ProductWithImages } from '../repositories/product.repository';
import { categoryRepository } from '../repositories/category.repository';
import { AppError } from '../middleware/errorHandler';
import { Product } from '../types/models.types';

type CreateInput = {
  name: string;
  description: string;
  price: number;
  category_id: string;
  stock: number;
  is_visible: boolean;
};

type UpdateInput = Partial<CreateInput>;

export const productService = {
  async getAllVisibleProducts(categoryId?: string): Promise<ProductWithImages[]> {
    return productRepository.findAllVisible(categoryId);
  },

  async getAllProducts(): Promise<ProductWithImages[]> {
    return productRepository.findAll();
  },

  async getProductById(id: string): Promise<ProductWithImages> {
    const product = await productRepository.findById(id);
    if (!product) throw new AppError('Product not found', 404);
    return product;
  },

  async createProduct(input: CreateInput): Promise<Product> {
    const category = await categoryRepository.findById(input.category_id);
    if (!category) throw new AppError('Category not found', 404);
    return productRepository.create(input);
  },

  async updateProduct(id: string, input: UpdateInput): Promise<Product> {
    const product = await productRepository.findById(id);
    if (!product) throw new AppError('Product not found', 404);

    if (input.category_id !== undefined) {
      const category = await categoryRepository.findById(input.category_id);
      if (!category) throw new AppError('Category not found', 404);
    }

    return productRepository.update(id, input);
  },

  async deleteProduct(id: string): Promise<void> {
    const product = await productRepository.findById(id);
    if (!product) throw new AppError('Product not found', 404);
    await productRepository.remove(id);
  },
};
