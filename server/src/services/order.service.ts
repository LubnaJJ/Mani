import { orderRepository, OrderWithDetails } from '../repositories/order.repository';
import { productRepository } from '../repositories/product.repository';
import { AppError } from '../middleware/errorHandler';
import { CustomSpec, Order } from '../types/models.types';

type CreateOrderInput = {
  customer_name: string;
  phone: string;
  address: string;
  payment_method: 'cod' | 'bank_transfer';
  items: Array<{ product_id: string; quantity: number }>;
};

export const orderService = {
  async getAllOrders(): Promise<Order[]> {
    return orderRepository.findAll();
  },

  async getOrderById(id: string): Promise<OrderWithDetails> {
    const order = await orderRepository.findById(id);
    if (!order) throw new AppError('Order not found', 404);
    return order;
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const resolvedItems: Array<{
      product_id: string;
      quantity: number;
      price_at_purchase: number;
      currentStock: number;
    }> = [];

    for (const item of input.items) {
      const product = await productRepository.findById(item.product_id);
      if (!product) throw new AppError(`Product not found: ${item.product_id}`, 404);
      if (!product.is_visible) {
        throw new AppError(`Product "${product.name}" is not available`, 400);
      }
      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for "${product.name}"`, 400);
      }
      resolvedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: product.price,
        currentStock: product.stock,
      });
    }

    const total = resolvedItems.reduce(
      (sum, item) => sum + item.price_at_purchase * item.quantity,
      0
    );

    const order = await orderRepository.create(
      { customer_name: input.customer_name, phone: input.phone, address: input.address, total, payment_method: input.payment_method },
      resolvedItems.map(({ product_id, quantity, price_at_purchase }) => ({
        product_id,
        quantity,
        price_at_purchase,
      }))
    );

    for (const item of resolvedItems) {
      await productRepository.update(item.product_id, {
        stock: item.currentStock - item.quantity,
      });
    }

    return order;
  },

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    const order = await orderRepository.findById(id);
    if (!order) throw new AppError('Order not found', 404);
    return orderRepository.updateStatus(id, status);
  },

  async updateOrderPaymentStatus(id: string, payment_status: Order['payment_status']): Promise<Order> {
    const order = await orderRepository.findById(id);
    if (!order) throw new AppError('Order not found', 404);
    return orderRepository.updatePaymentStatus(id, payment_status);
  },

  async createCustomOrder(input: {
    customer_name: string;
    phone: string;
    address: string;
    payment_method: 'cod' | 'bank_transfer';
    custom_spec: CustomSpec;
  }): Promise<Order> {
    const total =
      2500 +
      input.custom_spec.charms.length * 200 +
      input.custom_spec.bead_colors.length * 300;
    return orderRepository.createCustomOrder({ ...input, total });
  },
};
