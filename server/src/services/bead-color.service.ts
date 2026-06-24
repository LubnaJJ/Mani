import { beadColorRepository } from '../repositories/bead-color.repository';
import { AppError } from '../middleware/errorHandler';
import { BeadColor } from '../types/models.types';

export const beadColorService = {
  async getAll(onlyAvailable: boolean): Promise<BeadColor[]> {
    return beadColorRepository.findAll(onlyAvailable);
  },

  async create(data: { name: string; hex_code: string; is_available: boolean }): Promise<BeadColor> {
    if (!data.name.trim()) throw new AppError('Name is required', 400);
    if (!data.hex_code.match(/^#[0-9A-Fa-f]{6}$/)) {
      throw new AppError('Hex code must be a valid 6-digit colour (e.g. #B5837A)', 400);
    }
    return beadColorRepository.create(data);
  },

  async update(
    id: string,
    data: { name?: string; hex_code?: string; is_available?: boolean }
  ): Promise<BeadColor> {
    const existing = await beadColorRepository.findById(id);
    if (!existing) throw new AppError('Bead color not found', 404);
    if (data.hex_code !== undefined && !data.hex_code.match(/^#[0-9A-Fa-f]{6}$/)) {
      throw new AppError('Hex code must be a valid 6-digit colour (e.g. #B5837A)', 400);
    }
    return beadColorRepository.update(id, data);
  },

  async delete(id: string): Promise<void> {
    const existing = await beadColorRepository.findById(id);
    if (!existing) throw new AppError('Bead color not found', 404);
    return beadColorRepository.delete(id);
  },
};
