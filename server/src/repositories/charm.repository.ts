import { supabase } from '../config/supabase';
import { Charm } from '../types/models.types';

type CreateCharmData = Pick<Charm, 'name' | 'icon_svg' | 'is_available'>;
type UpdateCharmData = Partial<CreateCharmData>;

export const charmRepository = {
  async findAll(onlyAvailable = false): Promise<Charm[]> {
    let query = supabase.from('charms').select('*').order('created_at', { ascending: true });
    if (onlyAvailable) query = query.eq('is_available', true);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Charm[];
  },

  async findById(id: string): Promise<Charm | null> {
    const { data, error } = await supabase
      .from('charms')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as Charm;
  },

  async create(data: CreateCharmData): Promise<Charm> {
    const { data: charm, error } = await supabase
      .from('charms')
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return charm as Charm;
  },

  async update(id: string, data: UpdateCharmData): Promise<Charm> {
    const { data: charm, error } = await supabase
      .from('charms')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return charm as Charm;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('charms').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
