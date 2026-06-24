import { categoryRepository } from '../repositories/category.repository';
import { AppError } from '../middleware/errorHandler';
import { Category } from '../types/models.types';

export const categoryService = {
  async getAllCategories(): Promise<Category[]> {
    return categoryRepository.findAll();
  },

  async getCategoryById(id: string): Promise<Category> {
    const category = await categoryRepository.findById(id);
    if (!category) throw new AppError('Category not found', 404);
    return category;
  },

  async createCategory(name: string, slug: string): Promise<Category> {
    const existing = await categoryRepository.findBySlug(slug);
    if (existing) throw new AppError('A category with this slug already exists', 409);
    return categoryRepository.create({ name, slug });
  },

  async updateCategory(
    id: string,
    input: Partial<{ name: string; slug: string }>
  ): Promise<Category> {
    const category = await categoryRepository.findById(id);
    if (!category) throw new AppError('Category not found', 404);

    if (input.slug !== undefined && input.slug !== category.slug) {
      const conflict = await categoryRepository.findBySlug(input.slug);
      if (conflict) throw new AppError('A category with this slug already exists', 409);
    }

    return categoryRepository.update(id, input);
  },

  async deleteCategory(id: string): Promise<void> {
    const category = await categoryRepository.findById(id);
    if (!category) throw new AppError('Category not found', 404);
    await categoryRepository.remove(id);
  },
};
