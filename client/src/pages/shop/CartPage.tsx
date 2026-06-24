import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cart.store';
import { Product } from '../../types';
import Nav from '../../components/layout/Nav';
import Footer from '../../components/layout/Footer';
import { lkr } from '../../utils/format';

const px = 'px-8 md:px-16 lg:px-24';

function getPrimaryImage(product: Product): string | null {
  const imgs = product.product_images ?? [];
  return (imgs.find((i) => i.is_primary) ?? imgs[0])?.cloudinary_url ?? null;
}

export default function CartPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const total = useCartStore((s) => s.total);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  /* ── Empty state ─────────────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-bg">
        <Nav />
        <main className="pt-[72px]">
          <div className={`${px} py-32 text-center`}>
            <p className="font-display text-3xl text-ink-2 mb-4">
              Your cart is empty.
            </p>
            <p className="font-body text-sm text-ink-3 mb-10">
              You haven't added any pieces yet.
            </p>
            <Link to="/shop" className="btn-outline">
              Browse Collection
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Nav />

      <main className="pt-[72px]">
        {/* ── Header ───────────────────────────────────────────── */}
        <div className={`${px} py-12 border-b border-border`}>
          <h1 className="font-display text-4xl text-ink">Cart</h1>
          <p className="font-body text-[11px] text-ink-3 tracking-[0.15em] mt-1.5">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* ── Content ──────────────────────────────────────────── */}
        <div className={`${px} py-16 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-16`}>

          {/* ── Items list ─────────────────────────────────────── */}
          <div>
            {items.map((item, index) => {
              const imageUrl = getPrimaryImage(item.product);
              const lineTotal = item.product.price * item.quantity;

              return (
                <div
                  key={item.product.id}
                  className={[
                    'flex gap-6 py-8',
                    index > 0 ? 'border-t border-border' : '',
                  ].join(' ')}
                >
                  {/* Thumbnail */}
                  <Link
                    to={`/product/${item.product.id}`}
                    className="flex-shrink-0 block"
                  >
                    <div className="w-24 h-24 md:w-28 md:h-28 bg-surface border border-border overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover hover:opacity-75 transition-opacity duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-display text-xl text-border select-none">
                            まに
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    {/* Top row: name + remove */}
                    <div className="flex items-start justify-between gap-4">
                      <Link
                        to={`/product/${item.product.id}`}
                        className="min-w-0 group"
                      >
                        <p className="font-display text-lg text-ink leading-snug group-hover:opacity-70 transition-opacity duration-200">
                          {item.product.name}
                        </p>
                        <p className="font-body text-sm text-ink-2 font-light mt-1 tabular-nums">
                          {lkr(item.product.price)} each
                        </p>
                      </Link>

                      <button
                        onClick={() => removeItem(item.product.id)}
                        aria-label={`Remove ${item.product.name}`}
                        className="font-body text-ink-3 hover:text-ink transition-colors duration-200 text-xl leading-none flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>

                    {/* Bottom row: quantity + line total */}
                    <div className="flex items-center justify-between mt-5">
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                          className="w-9 h-9 flex items-center justify-center font-body text-ink-2 hover:text-ink hover:bg-surface transition-colors duration-150"
                        >
                          −
                        </button>
                        <span className="w-9 text-center font-body text-sm text-ink select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              Math.min(item.product.stock, item.quantity + 1)
                            )
                          }
                          aria-label="Increase quantity"
                          className="w-9 h-9 flex items-center justify-center font-body text-ink-2 hover:text-ink hover:bg-surface transition-colors duration-150"
                        >
                          +
                        </button>
                      </div>

                      <p className="font-body text-sm text-ink tabular-nums">
                        {lkr(lineTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Order summary ──────────────────────────────────── */}
          <div>
            <div className="border border-border bg-surface p-8 sticky top-[88px]">
              <p className="font-body text-[10px] tracking-[0.3em] text-ink-2 uppercase mb-7">
                Summary
              </p>

              <div className="flex justify-between items-baseline mb-3">
                <span className="font-body text-sm text-ink-2">
                  Subtotal
                </span>
                <span className="font-body text-sm text-ink tabular-nums">
                  {lkr(total())}
                </span>
              </div>

              <div className="flex justify-between items-baseline mb-8">
                <span className="font-body text-sm text-ink-2">Shipping</span>
                <span className="font-body text-[11px] text-ink-3">
                  Calculated at checkout
                </span>
              </div>

              <hr className="border-border mb-7" />

              <div className="flex justify-between items-baseline mb-8">
                <span className="font-display text-base text-ink">Total</span>
                <span className="font-display text-xl text-ink tabular-nums">
                  {lkr(total())}
                </span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="btn-primary w-full text-center"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/shop"
                className="block text-center font-body text-[10px] text-ink-3 tracking-[0.18em] uppercase hover:text-ink-2 transition-colors duration-200 mt-6"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
