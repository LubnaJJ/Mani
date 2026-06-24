import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import api from '../../services/api';
import { ApiResponse, Order, PaymentSlip, Product } from '../../types';
import { lkr } from '../../utils/format';
import Nav from '../../components/layout/Nav';
import Footer from '../../components/layout/Footer';

const px = 'px-5 sm:px-8 md:px-16 lg:px-24';

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getApiError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const e = err as { response?: { data?: { error?: string } } };
    return e.response?.data?.error ?? 'Upload failed. Please try again.';
  }
  return 'Upload failed. Please try again.';
}

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [slip, setSlip] = useState<PaymentSlip | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<ApiResponse<Order>>(`/orders/${id}`)
      .then(async (res) => {
        const o = res.data.data;
        if (!o) { setNotFound(true); return; }
        setOrder(o);
        setSlip(o.payment_slips?.[0] ?? null);
        // Resolve product names from public endpoint
        const ids = [...new Set((o.order_items ?? []).map((i) => i.product_id))];
        const settled = await Promise.allSettled(
          ids.map((pid) => api.get<ApiResponse<Product>>(`/products/${pid}`))
        );
        const nameMap: Record<string, string> = {};
        settled.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            const p = result.value.data.data;
            if (p) nameMap[ids[idx]] = p.name;
          }
        });
        setProducts(nameMap);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleUpload() {
    if (!selectedFile || !order) return;
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('order_id', order.id);
      formData.append('image', selectedFile);
      const res = await axios.post<ApiResponse<PaymentSlip>>(
        '/api/upload/payment-slip',
        formData
      );
      setSlip(res.data.data!);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadError(getApiError(err));
    } finally {
      setUploading(false);
    }
  }

  /* ── Loading ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Nav />
        <main className="pt-[72px]">
          <div className={`${px} py-32 flex flex-col gap-5`}>
            {[320, 200, 260, 180].map((w, i) => (
              <div
                key={i}
                className="h-5 bg-surface animate-pulse"
                style={{ width: w }}
              />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Not found ───────────────────────────────────────────── */
  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-bg">
        <Nav />
        <main className="pt-[72px]">
          <div className={`${px} py-32 text-center`}>
            <p className="font-display text-3xl text-ink-2 mb-6">
              Order not found.
            </p>
            <Link to="/shop" className="btn-outline">
              Return to Collection
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Confirmation ────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-bg">
      <Nav />

      <main className="pt-[72px]">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className={`${px} py-10 sm:py-16 border-b border-border`}>
          <p className="font-body text-[10px] tracking-[0.3em] text-ink-3 uppercase mb-4">
            Order #{shortId(order.id)}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-ink leading-[1.1] mb-4">
            Thank you,<br />
            {order.customer_name.split(' ')[0]}.
          </h1>
          <p className="font-body text-sm text-ink-2 font-light">
            Your order was placed on {formatDate(order.created_at)}.
          </p>
        </div>

        {/* ── Content ────────────────────────────────────────── */}
        <div
          className={`${px} py-10 sm:py-16 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 sm:gap-16`}
        >
          {/* ── Left: Next steps ───────────────────────────── */}
          <div>
            <p className="font-body text-[10px] tracking-[0.3em] text-ink-2 uppercase mb-8">
              Next Steps
            </p>

            {order.payment_method === 'cod' ? (
              /* ── Cash on Delivery ── */
              <div className="flex flex-col gap-8">
                <div className="border border-border p-8">
                  <p className="font-body text-[10px] tracking-[0.25em] text-sage uppercase mb-3">
                    Cash on Delivery
                  </p>
                  <p className="font-body text-sm text-ink-2 font-light leading-relaxed">
                    No payment needed now. Pay in cash when your order is delivered to your doorstep.
                  </p>
                </div>

                <div className="flex gap-5">
                  <span className="font-display text-2xl text-border select-none flex-shrink-0 leading-none mt-0.5">1</span>
                  <div>
                    <p className="font-display text-lg text-ink mb-1.5">We'll prepare your order</p>
                    <p className="font-body text-sm text-ink-2 font-light leading-relaxed">
                      Your order has been received. We'll begin preparing it for dispatch shortly.
                    </p>
                  </div>
                </div>

                <div className="flex gap-5">
                  <span className="font-display text-2xl text-border select-none flex-shrink-0 leading-none mt-0.5">2</span>
                  <div>
                    <p className="font-display text-ink text-lg mb-1.5">Pay on delivery</p>
                    <p className="font-body text-sm text-ink-2 font-light leading-relaxed">
                      Have{' '}
                      <span className="text-ink tabular-nums">{lkr(order.total)}</span>{' '}
                      ready when our courier arrives.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Bank Transfer ── */
              <div>
                <div className="flex flex-col gap-8 mb-12">
                  <div className="flex gap-5">
                    <span className="font-display text-2xl text-border select-none flex-shrink-0 leading-none mt-0.5">1</span>
                    <div>
                      <p className="font-display text-lg text-ink mb-1.5">Transfer the total amount</p>
                      <p className="font-body text-sm text-ink-2 font-light leading-relaxed">
                        Use the bank details below to transfer{' '}
                        <span className="text-ink tabular-nums">{lkr(order.total)}</span>{' '}
                        to complete your purchase.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-5">
                    <span className="font-display text-2xl text-border select-none flex-shrink-0 leading-none mt-0.5">2</span>
                    <div>
                      <p className="font-display text-lg text-ink mb-1.5">Upload your payment slip</p>
                      <p className="font-body text-sm text-ink-2 font-light leading-relaxed">
                        Take a screenshot or photo of your transfer confirmation and upload it below so we can verify your payment.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-5">
                    <span className="font-display text-2xl text-border select-none flex-shrink-0 leading-none mt-0.5">3</span>
                    <div>
                      <p className="font-display text-ink text-lg mb-1.5">We'll confirm your order</p>
                      <p className="font-body text-sm text-ink-2 font-light leading-relaxed">
                        Once we've verified your payment, we'll update your order status and dispatch your pieces.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bank details */}
                <div className="border border-border bg-surface p-8 mb-10">
                  <p className="font-body text-[10px] tracking-[0.3em] text-ink-2 uppercase mb-6">
                    Bank Transfer Details
                  </p>
                  <div className="flex flex-col gap-3">
                    {[
                      ['Bank', 'Commercial Bank of Ceylon'],
                      ['Account Name', 'Mani Jewellery'],
                      ['Account Number', '1234567890'],
                      ['Branch', 'Colombo'],
                      ['Amount', lkr(order.total)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-baseline gap-4">
                        <span className="font-body text-[11px] text-ink-3 whitespace-nowrap">{label}</span>
                        <span
                          className={[
                            'font-body text-sm text-ink text-right',
                            label === 'Amount' ? 'font-display tabular-nums' : '',
                          ].join(' ')}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment slip upload */}
                <div>
                  <p className="font-body text-[10px] tracking-[0.3em] text-ink-2 uppercase mb-6">
                    Upload Payment Slip
                  </p>

                  {slip ? (
                    <div>
                      <img
                        src={slip.cloudinary_url}
                        alt="Payment slip"
                        className="w-full max-w-sm border border-border object-cover mb-3"
                      />
                      <p className="font-body text-[11px] text-sage">
                        Payment slip uploaded. We'll verify and confirm your order shortly.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <label className="border border-border border-dashed bg-surface p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-bg transition-colors duration-150">
                        <span className="font-display text-3xl text-border select-none">↑</span>
                        <span className="font-body text-sm text-ink-2 text-center">
                          {selectedFile ? selectedFile.name : 'Click to select your transfer screenshot'}
                        </span>
                        <span className="font-body text-[10px] text-ink-3 tracking-[0.1em]">
                          JPG, PNG or WEBP · max 5 MB
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                          className="sr-only"
                        />
                      </label>

                      {uploadError && (
                        <p className="font-body text-xs text-accent-dark">{uploadError}</p>
                      )}

                      <button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="btn-primary disabled:opacity-40 w-full sm:w-auto sm:self-start"
                      >
                        {uploading ? 'Uploading…' : 'Upload Slip'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Order summary ──────────────────────────── */}
          <div>
            <div className="border border-border bg-surface p-6 sm:p-8 sm:sticky sm:top-[88px]">
              <p className="font-body text-[10px] tracking-[0.3em] text-ink-2 uppercase mb-6">
                Your Order
              </p>

              {order.order_items?.length ? (
                <div className="flex flex-col gap-4 mb-6">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-ink truncate">
                          {products[item.product_id] ?? item.product_id.slice(0, 8) + '…'}
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
                </div>
              ) : null}

              <hr className="border-border mb-5" />

              <div className="flex justify-between items-baseline mb-8">
                <span className="font-display text-base text-ink">Total</span>
                <span className="font-display text-xl text-ink tabular-nums">
                  {lkr(order.total)}
                </span>
              </div>

              {/* Delivery info */}
              <div className="flex flex-col gap-1">
                <p className="font-body text-[10px] tracking-[0.2em] text-ink-3 uppercase mb-2">
                  Delivering to
                </p>
                <p className="font-body text-sm text-ink">{order.customer_name}</p>
                <p className="font-body text-sm text-ink-2">{order.phone}</p>
                <p className="font-body text-sm text-ink-2 leading-relaxed">
                  {order.address}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer CTA ─────────────────────────────────────── */}
        <div className={`${px} pb-20`}>
          <Link
            to="/shop"
            className="font-body text-[10px] text-ink-3 tracking-[0.18em] uppercase hover:text-ink-2 transition-colors duration-200"
          >
            ← Continue Shopping
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
