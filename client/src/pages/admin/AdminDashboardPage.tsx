import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Product, Order, ApiResponse } from '../../types';
import { lkr } from '../../utils/format';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  lowStockProducts: Product[];
  recentOrders: Order[];
}

const statusColours: Record<Order['status'], string> = {
  pending: 'text-accent-dark',
  confirmed: 'text-sage',
  shipped: 'text-ink-2',
  delivered: 'text-ink',
  cancelled: 'text-ink-3',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<ApiResponse<Product[]>>('/products/admin'),
      api.get<ApiResponse<Order[]>>('/orders'),
    ])
      .then(([productsRes, ordersRes]) => {
        const products = productsRes.data.data ?? [];
        const orders = ordersRes.data.data ?? [];
        setStats({
          totalProducts: products.length,
          totalOrders: orders.length,
          lowStockProducts: products
            .filter((p) => p.stock < 5)
            .sort((a, b) => a.stock - b.stock),
          recentOrders: orders.slice(0, 5),
        });
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 lg:p-12">
        <div className="h-4 w-32 bg-surface animate-pulse mb-12" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border mb-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-bg h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-4 sm:p-8 lg:p-12">
        <p className="font-body text-sm text-accent-dark">{error || 'No data.'}</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Products', value: stats.totalProducts, to: '/admin/products' },
    { label: 'Total Orders', value: stats.totalOrders, to: '/admin/orders' },
    {
      label: 'Low Stock',
      value: stats.lowStockProducts.length,
      to: '/admin/products',
      warn: stats.lowStockProducts.length > 0,
    },
  ];

  return (
    <div className="p-4 sm:p-8 lg:p-12">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-8 sm:mb-12 border-b border-border pb-6">
        <h1 className="font-display text-2xl sm:text-3xl text-ink">Dashboard</h1>
        <span className="font-body text-[11px] text-ink-3 tracking-[0.15em]">
          {new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border mb-8 sm:mb-12">
        {statCards.map(({ label, value, to, warn }) => (
          <Link key={label} to={to} className="bg-bg p-5 sm:p-8 group hover:bg-surface transition-colors duration-200">
            <p className="font-body text-[10px] tracking-[0.25em] text-ink-3 uppercase mb-4">
              {label}
            </p>
            <p
              className={[
                'font-display text-5xl leading-none',
                warn ? 'text-accent-dark' : 'text-ink',
              ].join(' ')}
            >
              {value}
            </p>
          </Link>
        ))}
      </div>

      {/* Two-column lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low stock */}
        <div className="border border-border">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <p className="font-body text-[10px] tracking-[0.25em] text-ink-2 uppercase">
              Low Stock
            </p>
            <span className="font-body text-[10px] text-ink-3">stock &lt; 5</span>
          </div>

          {stats.lowStockProducts.length === 0 ? (
            <div className="px-6 py-8">
              <p className="font-body text-sm text-ink-3">All products well stocked.</p>
            </div>
          ) : (
            <ul>
              {stats.lowStockProducts.map((p, i) => (
                <li
                  key={p.id}
                  className={[
                    'flex items-center justify-between px-6 py-4',
                    i < stats.lowStockProducts.length - 1 ? 'border-b border-border' : '',
                  ].join(' ')}
                >
                  <span className="font-body text-sm text-ink">{p.name}</span>
                  <span
                    className={[
                      'font-body text-xs tabular-nums',
                      p.stock === 0 ? 'text-accent-dark' : 'text-ink-2',
                    ].join(' ')}
                  >
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent orders */}
        <div className="border border-border">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <p className="font-body text-[10px] tracking-[0.25em] text-ink-2 uppercase">
              Recent Orders
            </p>
            <Link
              to="/admin/orders"
              className="font-body text-[10px] text-ink-3 hover:text-ink transition-colors duration-200"
            >
              View all →
            </Link>
          </div>

          {stats.recentOrders.length === 0 ? (
            <div className="px-6 py-8">
              <p className="font-body text-sm text-ink-3">No orders yet.</p>
            </div>
          ) : (
            <ul>
              {stats.recentOrders.map((order, i) => (
                <li
                  key={order.id}
                  className={[
                    'flex items-center justify-between px-6 py-4',
                    i < stats.recentOrders.length - 1 ? 'border-b border-border' : '',
                  ].join(' ')}
                >
                  <div>
                    <p className="font-body text-sm text-ink">{order.customer_name}</p>
                    <p className="font-body text-[11px] text-ink-3 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-sm text-ink tabular-nums">
                      {lkr(order.total)}
                    </p>
                    <p className={['font-body text-[11px] mt-0.5 capitalize', statusColours[order.status]].join(' ')}>
                      {order.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
