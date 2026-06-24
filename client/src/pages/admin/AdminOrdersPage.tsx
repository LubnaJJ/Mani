import { useEffect, useState } from 'react';
import api from '../../services/api';
import { ApiResponse, Order, Product } from '../../types';
import { lkr } from '../../utils/format';

function getApiError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const e = err as { response?: { data?: { error?: string } } };
    return e.response?.data?.error ?? 'Something went wrong.';
  }
  return 'Something went wrong.';
}

const STATUS_TEXT: Record<Order['status'], string> = {
  pending: 'text-accent-dark',
  confirmed: 'text-sage',
  shipped: 'text-ink-2',
  delivered: 'text-ink',
  cancelled: 'text-ink-3',
};

const ALL_STATUSES: Order['status'][] = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailStatus, setDetailStatus] = useState<Order['status']>('pending');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [detailPaymentStatus, setDetailPaymentStatus] = useState<Order['payment_status']>('unpaid');
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false);
  const [paymentStatusError, setPaymentStatusError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        api.get<ApiResponse<Order[]>>('/orders'),
        api.get<ApiResponse<Product[]>>('/products/admin'),
      ]);
      setOrders(ordersRes.data.data ?? []);
      setProducts(productsRes.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(order: Order) {
    setLoadingDetail(true);
    setStatusError('');
    setPaymentStatusError('');
    try {
      const res = await api.get<ApiResponse<Order>>(`/orders/${order.id}`);
      const fetched = res.data.data!;
      setDetail(fetched);
      setDetailStatus(fetched.status);
      setDetailPaymentStatus(fetched.payment_status);
    } finally {
      setLoadingDetail(false);
    }
  }

  function closeDetail() {
    setDetail(null);
    setStatusError('');
    setPaymentStatusError('');
  }

  async function handleUpdateStatus() {
    if (!detail) return;
    setUpdatingStatus(true);
    setStatusError('');
    try {
      await api.patch(`/orders/${detail.id}/status`, { status: detailStatus });
      const updated = { ...detail, status: detailStatus };
      setDetail(updated);
      setOrders((prev) =>
        prev.map((o) => (o.id === detail.id ? { ...o, status: detailStatus } : o))
      );
    } catch (err) {
      setStatusError(getApiError(err));
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleUpdatePaymentStatus() {
    if (!detail) return;
    setUpdatingPaymentStatus(true);
    setPaymentStatusError('');
    try {
      await api.patch(`/orders/${detail.id}/payment-status`, { payment_status: detailPaymentStatus });
      const updated = { ...detail, payment_status: detailPaymentStatus };
      setDetail(updated);
      setOrders((prev) =>
        prev.map((o) => (o.id === detail.id ? { ...o, payment_status: detailPaymentStatus } : o))
      );
    } catch (err) {
      setPaymentStatusError(getApiError(err));
    } finally {
      setUpdatingPaymentStatus(false);
    }
  }

  const productName = (productId: string) =>
    products.find((p) => p.id === productId)?.name ?? productId.slice(0, 8) + '…';

  return (
    <div className="p-4 sm:p-8 lg:p-12">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-8 sm:mb-12 border-b border-border pb-6">
        <h1 className="font-display text-2xl sm:text-3xl text-ink">Orders</h1>
        <span className="font-body text-[11px] text-ink-3">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </span>
      </div>

      {/* Table */}
      <div className="border border-border overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Head */}
          <div className="grid grid-cols-[6rem_1fr_7rem_6rem_7rem_6rem_9rem] border-b border-border bg-surface">
            {['Order', 'Customer', 'Date', 'Total', 'Status', 'Method', 'Pay Status'].map((h) => (
              <div key={h} className="px-4 py-3">
                <span className="font-body text-[10px] tracking-[0.25em] text-ink-2 uppercase">
                  {h}
                </span>
              </div>
            ))}
          </div>

          {/* Skeleton */}
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[6rem_1fr_7rem_6rem_7rem_6rem_9rem] border-b border-border last:border-0"
              >
                {[60, 120, 80, 55, 70, 40, 65].map((w, j) => (
                  <div key={j} className="px-4 py-4 flex items-center">
                    <div className="h-4 bg-surface animate-pulse" style={{ width: w }} />
                  </div>
                ))}
              </div>
            ))}

          {/* Empty */}
          {!loading && orders.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="font-body text-sm text-ink-3">No orders yet.</p>
            </div>
          )}

          {/* Rows */}
          {!loading &&
            orders.map((order) => (
              <div
                key={order.id}
                onClick={() => openDetail(order)}
                className={[
                  'grid grid-cols-[6rem_1fr_7rem_6rem_7rem_6rem_9rem] border-b border-border last:border-0 cursor-pointer transition-colors duration-150',
                  detail?.id === order.id ? 'bg-surface' : 'hover:bg-surface',
                ].join(' ')}
              >
                <div className="px-4 py-4 flex items-center">
                  <span className="font-body text-xs text-ink-2 tracking-[0.06em]">
                    #{shortId(order.id)}
                  </span>
                </div>
                <div className="px-4 py-4 flex items-center min-w-0">
                  <span className="font-body text-sm text-ink truncate">
                    {order.customer_name}
                  </span>
                </div>
                <div className="px-4 py-4 flex items-center">
                  <span className="font-body text-sm text-ink-2">
                    {formatDate(order.created_at)}
                  </span>
                </div>
                <div className="px-4 py-4 flex items-center">
                  <span className="font-body text-sm text-ink tabular-nums">
                    {lkr(order.total)}
                  </span>
                </div>
                <div className="px-4 py-4 flex items-center">
                  <span
                    className={[
                      'font-body text-[11px] tracking-[0.1em] capitalize',
                      STATUS_TEXT[order.status],
                    ].join(' ')}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="px-4 py-4 flex items-center">
                  <span className="font-body text-[11px] text-ink-2">
                    {order.payment_method === 'cod' ? 'COD' : 'Bank'}
                  </span>
                </div>
                <div className="px-4 py-4 flex items-center">
                  <span
                    className={[
                      'font-body text-[11px] tracking-[0.08em] capitalize',
                      order.payment_status === 'unpaid'
                        ? 'text-accent-dark'
                        : order.payment_status === 'paid'
                        ? 'text-ink-2'
                        : 'text-sage',
                    ].join(' ')}
                  >
                    {order.payment_status}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ── Detail drawer ────────────────────────────────────────── */}
      {(detail || loadingDetail) && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-ink/20"
            onClick={closeDetail}
          />

          {/* Drawer */}
          <aside className="fixed top-0 right-0 h-screen w-full sm:w-[420px] z-50 bg-bg border-l border-border flex flex-col overflow-hidden">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-border flex-shrink-0">
              <p className="font-body text-[10px] tracking-[0.25em] text-ink-2 uppercase">
                {detail ? `Order #${shortId(detail.id)}` : 'Loading…'}
              </p>
              <button
                onClick={closeDetail}
                className="font-body text-ink-3 hover:text-ink transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex-1 p-8 flex flex-col gap-4">
                {[200, 140, 100, 160, 240].map((w, i) => (
                  <div key={i} className="h-4 bg-surface animate-pulse" style={{ width: w }} />
                ))}
              </div>
            ) : detail ? (
              <div className="flex-1 overflow-y-auto">
                {/* Customer info */}
                <div className="px-8 py-6 border-b border-border">
                  <p className="font-body text-[10px] tracking-[0.25em] text-ink-3 uppercase mb-4">
                    Customer
                  </p>
                  <p className="font-display text-lg text-ink leading-snug">
                    {detail.customer_name}
                  </p>
                  <p className="font-body text-sm text-ink-2 mt-1">{detail.phone}</p>
                  <p className="font-body text-sm text-ink-2 mt-0.5">{detail.address}</p>
                  <p className="font-body text-[11px] text-ink-3 mt-3">
                    {formatDate(detail.created_at)}
                  </p>
                </div>

                {/* Order items */}
                <div className="px-8 py-6 border-b border-border">
                  <p className="font-body text-[10px] tracking-[0.25em] text-ink-3 uppercase mb-4">
                    Items
                  </p>

                  {detail.order_items?.length ? (
                    <div className="flex flex-col gap-3">
                      {detail.order_items.map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-sm text-ink truncate">
                              {productName(item.product_id)}
                            </p>
                            <p className="font-body text-[11px] text-ink-3 mt-0.5">
                              qty {item.quantity} · {lkr(item.price_at_purchase)} each
                            </p>
                          </div>
                          <span className="font-body text-sm text-ink tabular-nums flex-shrink-0">
                            {lkr(item.price_at_purchase * item.quantity)}
                          </span>
                        </div>
                      ))}

                      <div className="flex justify-between border-t border-border pt-3 mt-1">
                        <span className="font-body text-[11px] tracking-[0.15em] text-ink-2 uppercase">
                          Total
                        </span>
                        <span className="font-display text-base text-ink tabular-nums">
                          {lkr(detail.total)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="font-body text-sm text-ink-3">No items.</p>
                  )}
                </div>

                {/* Payment slip */}
                <div className="px-8 py-6 border-b border-border">
                  <p className="font-body text-[10px] tracking-[0.25em] text-ink-3 uppercase mb-4">
                    Payment Slip
                  </p>
                  {detail.payment_slips?.length ? (
                    <a
                      href={detail.payment_slips[0].cloudinary_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={detail.payment_slips[0].cloudinary_url}
                        alt="Payment slip"
                        className="w-full border border-border object-cover hover:opacity-75 transition-opacity duration-200"
                      />
                      <p className="font-body text-[10px] text-ink-3 mt-2">
                        Uploaded {formatDate(detail.payment_slips[0].uploaded_at)}
                        {' · '}Click to open full size
                      </p>
                    </a>
                  ) : (
                    <p className="font-body text-sm text-ink-3">
                      No payment slip uploaded yet.
                    </p>
                  )}
                </div>

                {/* Payment info */}
                <div className="px-8 py-6 border-b border-border">
                  <p className="font-body text-[10px] tracking-[0.25em] text-ink-3 uppercase mb-4">
                    Payment
                  </p>
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-body text-[11px] text-ink-3">Method</span>
                    <span className="font-body text-sm text-ink">
                      {detail.payment_method === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'}
                    </span>
                  </div>

                  <p className="font-body text-[10px] tracking-[0.2em] text-ink-3 uppercase mb-3">
                    Update Payment Status
                  </p>
                  <select
                    value={detailPaymentStatus}
                    onChange={(e) => setDetailPaymentStatus(e.target.value as Order['payment_status'])}
                    className="w-full border border-border bg-bg px-4 py-3 font-body text-sm text-ink outline-none focus:border-ink transition-colors mb-3"
                  >
                    {(['unpaid', 'paid', 'confirmed'] as Order['payment_status'][]).map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>

                  {paymentStatusError && (
                    <p className="font-body text-xs text-accent-dark mb-3">{paymentStatusError}</p>
                  )}

                  <button
                    onClick={handleUpdatePaymentStatus}
                    disabled={updatingPaymentStatus || detailPaymentStatus === detail.payment_status}
                    className="btn-primary w-full text-center disabled:opacity-40"
                  >
                    {updatingPaymentStatus ? 'Updating…' : 'Update Payment Status'}
                  </button>
                </div>

                {/* Fulfilment status update */}
                <div className="px-8 py-6">
                  <p className="font-body text-[10px] tracking-[0.25em] text-ink-3 uppercase mb-4">
                    Update Status
                  </p>

                  <select
                    value={detailStatus}
                    onChange={(e) =>
                      setDetailStatus(e.target.value as Order['status'])
                    }
                    className="w-full border border-border bg-bg px-4 py-3 font-body text-sm text-ink outline-none focus:border-ink transition-colors mb-4"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>

                  {statusError && (
                    <p className="font-body text-xs text-accent-dark mb-3">
                      {statusError}
                    </p>
                  )}

                  <button
                    onClick={handleUpdateStatus}
                    disabled={updatingStatus || detailStatus === detail.status}
                    className="btn-primary w-full text-center disabled:opacity-40"
                  >
                    {updatingStatus ? 'Updating…' : 'Update Status'}
                  </button>
                </div>
              </div>
            ) : null}
          </aside>
        </>
      )}
    </div>
  );
}
