import { supabase } from '../config/supabase';
import { Category } from '../types/models.types';

export const categoryRepository = {
  async findAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (error) throw new Error(error.message);
    return data as Category[];
  },

  async findById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as Category;
  },

  async findBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as Category;
  },

  async create(input: { name: string; slug: string }): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(input)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Category;
  },

  async update(
    id: string,
    input: Partial<{ name: string; slug: string }>
  ): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Category;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
