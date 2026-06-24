import { supabase } from '../config/supabase';
import { BeadColor } from '../types/models.types';

type CreateBeadColorData = Pick<BeadColor, 'name' | 'hex_code' | 'is_available'>;
type UpdateBeadColorData = Partial<CreateBeadColorData>;

export const beadColorRepository = {
  async findAll(onlyAvailable = false): Promise<BeadColor[]> {
    let query = supabase.from('bead_colors').select('*').order('created_at', { ascending: true });
    if (onlyAvailable) query = query.eq('is_available', true);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as BeadColor[];
  },

  async findById(id: string): Promise<BeadColor | null> {
    const { data, error } = await supabase
      .from('bead_colors')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as BeadColor;
  },

  async create(data: CreateBeadColorData): Promise<BeadColor> {
    const { data: color, error } = await supabase
      .from('bead_colors')
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return color as BeadColor;
  },

  async update(id: string, data: UpdateBeadColorData): Promise<BeadColor> {
    const { data: color, error } = await supabase
      .from('bead_colors')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return color as BeadColor;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('bead_colors').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
