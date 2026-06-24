import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../services/api';
import { ApiResponse, Order, Product } from '../../types';
import { useCartStore } from '../../store/cart.store';
import { lkr } from '../../utils/format';
import Nav from '../../components/layout/Nav';
import Footer from '../../components/layout/Footer';

const px = 'px-8 md:px-16 lg:px-24';

function getPrimaryImage(product: Product): string | null {
  const imgs = product.product_images ?? [];
  return (imgs.find((i) => i.is_primary) ?? imgs[0])?.cloudinary_url ?? null;
}

function getApiError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const e = err as { response?: { data?: { error?: string } } };
    return e.response?.data?.error ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}

const labelClass =
  'block font-body text-[10px] tracking-[0.15em] uppercase text-ink-2 mb-2';
const inputClass =
  'w-full border border-border bg-bg px-4 py-3 font-body text-sm text-ink outline-none focus:border-ink transition-colors duration-150 placeholder:text-ink-3';

export default function CheckoutPage() {
  const navigate = useNavigate();

  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  const clearCart = useCartStore((s) => s.clearCart);

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer'>('cod');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (
      !form.customer_name.trim() ||
      !form.phone.trim() ||
      !form.address.trim()
    ) {
      setError('All fields are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post<ApiResponse<Order>>('/orders', {
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        payment_method: paymentMethod,
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
      });
      const order = res.data.data!;
      if (paymentMethod === 'bank_transfer' && slipFile) {
        const formData = new FormData();
        formData.append('order_id', order.id);
        formData.append('image', slipFile);
        await axios.post('/api/upload/payment-slip', formData);
      }
      clearCart();
      navigate(`/order-confirmation/${order.id}`);
    } catch (err) {
      setError(getApiError(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <Nav />

      <main className="pt-[72px]">
        {/* ── Header ───────────────────────────────────────────── */}
        <div className={`${px} py-12 border-b border-border`}>
          <div className="flex items-baseline gap-6">
            <Link
              to="/cart"
              className="font-body text-[11px] text-ink-3 tracking-[0.18em] uppercase hover:text-ink-2 transition-colors duration-200"
            >
              ← Cart
            </Link>
            <h1 className="font-display text-4xl text-ink">Checkout</h1>
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────── */}
        <div
          className={`${px} py-16 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-16`}
        >
          {/* ── Left: Form ─────────────────────────────────────── */}
          <form onSubmit={handleSubmit} noValidate>
            <p className="font-body text-[10px] tracking-[0.3em] text-ink-2 uppercase mb-8">
              Delivery Information
            </p>

            <div className="flex flex-col gap-6">
              {/* Full name */}
              <div>
                <label htmlFor="customer_name" className={labelClass}>
                  Full Name
                </label>
                <input
                  id="customer_name"
                  name="customer_name"
                  type="text"
                  value={form.customer_name}
                  onChange={handleChange}
                  autoComplete="name"
                  placeholder="Your full name"
                  className={inputClass}
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  placeholder="+94 77 000 0000"
                  className={inputClass}
                />
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className={labelClass}>
                  Delivery Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={4}
                  autoComplete="street-address"
                  placeholder="Street address, city, postal code"
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            {/* Payment method */}
            <div className="mt-10">
              <p className="font-body text-[10px] tracking-[0.3em] text-ink-2 uppercase mb-5">
                Payment Method
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {(
                  [
                    { value: 'cod', label: 'Cash on Delivery', sub: 'Pay when your order arrives' },
                    { value: 'bank_transfer', label: 'Bank Transfer', sub: 'Transfer before dispatch' },
                  ] as const
                ).map(({ value, label, sub }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value)}
                    className={[
                      'p-5 border text-left transition-colors duration-150',
                      paymentMethod === value
                        ? 'border-ink bg-surface'
                        : 'border-border hover:border-ink-2',
                    ].join(' ')}
                  >
                    <p className="font-display text-base text-ink mb-1">{label}</p>
                    <p className="font-body text-[11px] text-ink-3">{sub}</p>
                  </button>
                ))}
              </div>

              {paymentMethod === 'bank_transfer' && (
                <div className="flex flex-col gap-5">
                  <div className="border border-border bg-surface p-6">
                    <p className="font-body text-[10px] tracking-[0.3em] text-ink-2 uppercase mb-4">
                      Bank Transfer Details
                    </p>
                    <div className="flex flex-col gap-2.5">
                      {[
                        ['Bank', 'Commercial Bank of Ceylon'],
                        ['Account Name', 'Mani Jewellery'],
                        ['Account Number', '1234567890'],
                        ['Branch', 'Colombo'],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between items-baseline gap-4">
                          <span className="font-body text-[11px] text-ink-3 whitespace-nowrap">
                            {label}
                          </span>
                          <span className="font-body text-sm text-ink text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-body text-[10px] tracking-[0.2em] text-ink-3 uppercase mb-3">
                      Upload Transfer Proof{' '}
                      <span className="normal-case tracking-normal">
                        (optional — you can also do this after)
                      </span>
                    </p>
                    <label className="border border-border border-dashed bg-surface p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-bg transition-colors duration-150">
                      <span className="font-display text-2xl text-border select-none">↑</span>
                      <span className="font-body text-sm text-ink-2 text-center">
                        {slipFile ? slipFile.name : 'Click to select your transfer screenshot'}
                      </span>
                      <span className="font-body text-[10px] text-ink-3 tracking-[0.1em]">
                        JPG, PNG or WEBP
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSlipFile(e.target.files?.[0] ?? null)}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="font-body text-xs text-accent-dark mt-6">
                {error}
              </p>
            )}

            <div className="mt-10 flex flex-col gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50"
              >
                {submitting ? 'Placing Order…' : 'Place Order'}
              </button>

              <Link
                to="/cart"
                className="text-center font-body text-[10px] text-ink-3 tracking-[0.18em] uppercase hover:text-ink-2 transition-colors duration-200"
              >
                ← Back to Cart
              </Link>
            </div>
          </form>

          {/* ── Right: Summary ─────────────────────────────────── */}
          <div>
            <div className="border border-border bg-surface p-8 sticky top-[88px]">
              <p className="font-body text-[10px] tracking-[0.3em] text-ink-2 uppercase mb-6">
                Order Summary
              </p>

              {/* Item list */}
              <div className="flex flex-col gap-4 mb-6">
                {items.map((item) => {
                  const imageUrl = getPrimaryImage(item.product);
                  return (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="w-14 h-14 flex-shrink-0 bg-bg border border-border overflow-hidden">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="font-display text-xs text-border select-none">
                              まに
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-ink truncate">
                          {item.product.name}
                        </p>
                        <p className="font-body text-[11px] text-ink-3 mt-0.5">
                          qty {item.quantity}
                        </p>
                      </div>

                      <span className="font-body text-sm text-ink tabular-nums flex-shrink-0">
                        {lkr(item.product.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <hr className="border-border mb-5" />

              <div className="flex justify-between items-baseline mb-5">
                <span className="font-display text-base text-ink">Total</span>
                <span className="font-display text-xl text-ink tabular-nums">
                  {lkr(total())}
                </span>
              </div>

              <p className="font-body text-[10px] text-ink-3 leading-relaxed">
                {paymentMethod === 'cod'
                  ? 'Pay in cash when your order is delivered.'
                  : 'Transfer details are shown after your order is placed.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
