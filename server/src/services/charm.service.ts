import { charmRepository } from '../repositories/charm.repository';
import { AppError } from '../middleware/errorHandler';
import { Charm } from '../types/models.types';

export const charmService = {
  async getAll(onlyAvailable: boolean): Promise<Charm[]> {
    return charmRepository.findAll(onlyAvailable);
  },

  async create(data: { name: string; icon_svg: string; is_available: boolean }): Promise<Charm> {
    if (!data.name.trim()) throw new AppError('Name is required', 400);
    if (!data.icon_svg.trim()) throw new AppError('Icon SVG is required', 400);
    return charmRepository.create(data);
  },

  async update(
    id: string,
    data: { name?: string; icon_svg?: string; is_available?: boolean }
  ): Promise<Charm> {
    const existing = await charmRepository.findById(id);
    if (!existing) throw new AppError('Charm not found', 404);
    return charmRepository.update(id, data);
  },

  async delete(id: string): Promise<void> {
    const existing = await charmRepository.findById(id);
    if (!existing) throw new AppError('Charm not found', 404);
    return charmRepository.delete(id);
  },
};
