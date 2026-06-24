import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ApiResponse, Category, Product } from '../../types';
import { lkr } from '../../utils/format';
import { useCartStore } from '../../store/cart.store';
import Nav from '../../components/layout/Nav';
import Footer from '../../components/layout/Footer';

const px = 'px-5 sm:px-8 md:px-16 lg:px-24';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<ApiResponse<Product>>(`/products/${id}`),
      api.get<ApiResponse<Category[]>>('/categories'),
    ])
      .then(([productRes, catsRes]) => {
        const p = productRes.data.data;
        if (!p) { setNotFound(true); return; }
        setProduct(p);
        setCategories(catsRes.data.data ?? []);
        const imgs = p.product_images ?? [];
        const primary = imgs.find((i) => i.is_primary) ?? imgs[0];
        setSelectedImage(primary?.cloudinary_url ?? null);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  function handleAddToCart() {
    if (!product || product.stock === 0) return;
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  const categoryName = product
    ? (categories.find((c) => c.id === product.category_id)?.name ?? null)
    : null;

  const images = product?.product_images ?? [];
  const outOfStock = product ? product.stock === 0 : false;
  const lowStock = product ? product.stock > 0 && product.stock < 5 : false;

  return (
    <div className="min-h-screen bg-bg">
      <Nav />

      <main className="pt-[72px]">
        {/* ── Back link ────────────────────────────────────────── */}
        <div className={`${px} pt-6 sm:pt-10 pb-0`}>
          <Link
            to="/shop"
            className="font-body text-[11px] text-ink-3 tracking-[0.18em] uppercase hover:text-ink-2 transition-colors duration-200"
          >
            ← All Pieces
          </Link>
        </div>

        {/* ── Loading skeleton ─────────────────────────────────── */}
        {loading && (
          <div className={`${px} py-10 sm:py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16`}>
            <div>
              <div className="aspect-[3/4] bg-surface animate-pulse" />
              <div className="flex gap-2 mt-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-16 h-16 bg-surface animate-pulse" />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4 pt-4">
              <div className="h-3 w-20 bg-surface animate-pulse" />
              <div className="h-10 w-3/4 bg-surface animate-pulse" />
              <div className="h-6 w-24 bg-surface animate-pulse" />
              <div className="h-3 w-full bg-surface animate-pulse mt-4" />
              <div className="h-3 w-5/6 bg-surface animate-pulse" />
              <div className="h-3 w-4/6 bg-surface animate-pulse" />
            </div>
          </div>
        )}

        {/* ── Not found ────────────────────────────────────────── */}
        {!loading && notFound && (
          <div className={`${px} py-32 text-center`}>
            <p className="font-display text-3xl text-ink-2 mb-6">
              This piece could not be found.
            </p>
            <Link to="/shop" className="btn-outline">
              Return to Collection
            </Link>
          </div>
        )}

        {/* ── Product detail ───────────────────────────────────── */}
        {!loading && product && (
          <div className={`${px} py-10 sm:py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16`}>

            {/* ── Left: Image gallery ──────────────────────────── */}
            <div>
              {/* Main image */}
              <div className="aspect-[3/4] bg-surface border border-border overflow-hidden">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-display text-8xl text-border select-none">
                      まに
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {images.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img.cloudinary_url)}
                      className={[
                        'w-16 h-16 border overflow-hidden flex-shrink-0 transition-all duration-150',
                        selectedImage === img.cloudinary_url
                          ? 'border-ink'
                          : 'border-border hover:border-ink-2',
                      ].join(' ')}
                    >
                      <img
                        src={img.cloudinary_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: Details ───────────────────────────────── */}
            <div className="flex flex-col">
              {/* Category */}
              {categoryName && (
                <Link
                  to="/shop"
                  className="font-body text-[10px] tracking-[0.3em] text-ink-3 uppercase hover:text-ink-2 transition-colors duration-200 mb-4 self-start"
                >
                  {categoryName}
                </Link>
              )}

              {/* Name */}
              <h1 className="font-display text-4xl md:text-5xl text-ink leading-[1.05] mb-5">
                {product.name}
              </h1>

              {/* Price */}
              <p className="font-body text-2xl text-ink font-light mb-6 tabular-nums">
                {lkr(product.price)}
              </p>

              {/* Stock indicator */}
              <div className="mb-8">
                {outOfStock ? (
                  <span className="font-body text-[11px] tracking-[0.15em] uppercase text-ink-3">
                    Out of Stock
                  </span>
                ) : lowStock ? (
                  <span className="font-body text-[11px] tracking-[0.15em] uppercase text-accent-dark">
                    Only {product.stock} left
                  </span>
                ) : (
                  <span className="font-body text-[11px] tracking-[0.15em] uppercase text-sage">
                    In Stock
                  </span>
                )}
              </div>

              {/* Divider */}
              <hr className="border-border mb-8" />

              {/* Description */}
              <p className="font-body text-sm text-ink-2 font-light leading-relaxed mb-10">
                {product.description}
              </p>

              {/* Quantity + Add to cart */}
              {!outOfStock && (
                <div className="flex flex-col gap-4">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-border self-start">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center font-body text-ink-2 hover:text-ink hover:bg-surface transition-colors duration-150 text-lg"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-body text-sm text-ink select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((q) => Math.min(product.stock, q + 1))
                      }
                      className="w-10 h-10 flex items-center justify-center font-body text-ink-2 hover:text-ink hover:bg-surface transition-colors duration-150 text-lg"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to cart */}
                  <button
                    onClick={handleAddToCart}
                    disabled={added}
                    className="btn-primary disabled:opacity-60 w-full sm:w-auto text-center"
                  >
                    {added ? 'Added to Cart' : 'Add to Cart'}
                  </button>

                  {added && (
                    <Link
                      to="/cart"
                      className="font-body text-[11px] text-ink-2 tracking-[0.15em] uppercase hover:text-ink transition-colors duration-200 self-start"
                    >
                      View Cart →
                    </Link>
                  )}
                </div>
              )}

              {outOfStock && (
                <p className="font-body text-sm text-ink-3 font-light">
                  This piece is currently unavailable. Check back soon.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
