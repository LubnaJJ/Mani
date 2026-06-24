export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  stock: number;
  is_visible: boolean;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  cloudinary_url: string;
  is_primary: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface BeadColor {
  id: string;
  name: string;
  hex_code: string;
  is_available: boolean;
  created_at: string;
}

export interface Charm {
  id: string;
  name: string;
  icon_svg: string;
  is_available: boolean;
  created_at: string;
}

export interface CustomSpec {
  bead_colors: string[];
  charms: string[];
  bead_count: number;
  wrist_size: string;
  special_instructions?: string;
  preferred_delivery_date?: string;
  initial_letter?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: 'cod' | 'bank_transfer';
  payment_status: 'unpaid' | 'paid' | 'confirmed';
  custom_spec?: CustomSpec | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
}

export interface PaymentSlip {
  id: string;
  order_id: string;
  cloudinary_url: string;
  uploaded_at: string;
}
