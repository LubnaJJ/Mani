import { supabase } from '../config/supabase';
import { CustomSpec, Order, OrderItem, PaymentSlip } from '../types/models.types';

export type OrderWithDetails = Order & {
  order_items: OrderItem[];
  payment_slips: PaymentSlip[];
};

type CreateOrderData = {
  customer_name: string;
  phone: string;
  address: string;
  total: number;
  payment_method: 'cod' | 'bank_transfer';
};

type CreateOrderItemData = {
  product_id: string;
  quantity: number;
  price_at_purchase: number;
};

export const orderRepository = {
  async findAll(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Order[];
  },

  async findById(id: string): Promise<OrderWithDetails | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), payment_slips(*)')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as OrderWithDetails;
  },

  async create(orderData: CreateOrderData, items: CreateOrderItemData[]): Promise<Order> {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ ...orderData, status: 'pending' })
      .select()
      .single();

    if (orderError) throw new Error(orderError.message);

    const typedOrder = order as Order;

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(items.map((item) => ({ ...item, order_id: typedOrder.id })));

    if (itemsError) throw new Error(itemsError.message);

    return typedOrder;
  },

  async updatePaymentStatus(id: string, payment_status: Order['payment_status']): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ payment_status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Order;
  },

  async updateStatus(id: string, status: Order['status']): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Order;
  },

  async createCustomOrder(data: {
    customer_name: string;
    phone: string;
    address: string;
    total: number;
    payment_method: 'cod' | 'bank_transfer';
    custom_spec: CustomSpec;
  }): Promise<Order> {
    const { data: order, error } = await supabase
      .from('orders')
      .insert({ ...data, status: 'pending' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return order as Order;
  },

  async addPaymentSlip(orderId: string, cloudinaryUrl: string): Promise<PaymentSlip> {
    const { data, error } = await supabase
      .from('payment_slips')
      .insert({ order_id: orderId, cloudinary_url: cloudinaryUrl })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as PaymentSlip;
  },
};
