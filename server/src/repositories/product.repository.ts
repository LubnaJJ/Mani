import { supabase } from '../config/supabase';
import { Product, ProductImage } from '../types/models.types';

export type ProductWithImages = Product & {
  product_images: ProductImage[];
};

type CreateInput = {
  name: string;
  description: string;
  price: number;
  category_id: string;
  stock: number;
  is_visible: boolean;
};

type UpdateInput = Partial<CreateInput>;

export const productRepository = {
  async findAllVisible(categoryId?: string): Promise<ProductWithImages[]> {
    let query = supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as ProductWithImages[];
  },

  async findAll(): Promise<ProductWithImages[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as ProductWithImages[];
  },

  async findById(id: string): Promise<ProductWithImages | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as ProductWithImages;
  },

  async create(input: CreateInput): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Product;
  },

  async update(id: string, input: UpdateInput): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Product;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async addImage(
    productId: string,
    cloudinaryUrl: string,
    isPrimary: boolean
  ): Promise<ProductImage> {
    if (isPrimary) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);
    }

    const { data, error } = await supabase
      .from('product_images')
      .insert({ product_id: productId, cloudinary_url: cloudinaryUrl, is_primary: isPrimary })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ProductImage;
  },

  async setImagePrimary(imageId: string, productId: string): Promise<void> {
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', productId);

    const { error } = await supabase
      .from('product_images')
      .update({ is_primary: true })
      .eq('id', imageId);

    if (error) throw new Error(error.message);
  },

  async removeImage(imageId: string): Promise<void> {
    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (error) throw new Error(error.message);
  },
};
