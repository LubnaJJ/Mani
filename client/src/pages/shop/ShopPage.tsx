import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { ApiResponse, Category, Product } from '../../types';
import Nav from '../../components/layout/Nav';
import Footer from '../../components/layout/Footer';
import ProductCard from '../../components/shop/ProductCard';

type SortOrder = '' | 'asc' | 'desc';

const px = 'px-5 sm:px-8 md:px-16 lg:px-24';

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('');

  useEffect(() => {
    Promise.all([
      api.get<ApiResponse<Product[]>>('/products'),
      api.get<ApiResponse<Category[]>>('/categories'),
    ])
      .then(([productsRes, catsRes]) => {
        setProducts(productsRes.data.data ?? []);
        setCategories(catsRes.data.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayed = useMemo(() => {
    const filtered = activeCategory
      ? products.filter((p) => p.category_id === activeCategory)
      : products;
    if (sortOrder === 'asc') return [...filtered].sort((a, b) => a.price - b.price);
    if (sortOrder === 'desc') return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [products, activeCategory, sortOrder]);

  const pillClass = (active: boolean) =>
    [
      'font-body text-[10px] tracking-[0.18em] uppercase px-4 py-2 border transition-colors duration-150 whitespace-nowrap flex-shrink-0',
      active
        ? 'bg-ink text-bg border-ink'
        : 'bg-transparent text-ink-2 border-border hover:border-ink-2 hover:text-ink',
    ].join(' ');

  return (
    <div className="min-h-screen bg-bg">
      <Nav />

      <main className="pt-[72px]">
        {/* ── Page header ──────────────────────────────────────── */}
        <div className={`${px} py-10 sm:py-12 border-b border-border`}>
          <div className="flex items-baseline justify-between">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-ink">Collection</h1>
            <span className="font-body text-[11px] text-ink-3 tracking-[0.15em]">
              {loading ? '—' : `${displayed.length} ${displayed.length === 1 ? 'piece' : 'pieces'}`}
            </span>
          </div>
        </div>

        {/* ── Filter + Sort bar ─────────────────────────────────── */}
        <div className={`${px} py-4 sm:py-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
          {/* Category pills — horizontal scroll on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-1 flex-nowrap [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setActiveCategory('')}
              className={pillClass(activeCategory === '')}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={pillClass(activeCategory === cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="self-start sm:self-auto flex-shrink-0 font-body text-[10px] tracking-[0.15em] uppercase border border-border bg-bg px-4 py-2 text-ink-2 outline-none focus:border-ink transition-colors cursor-pointer"
          >
            <option value="">Sort: Default</option>
            <option value="asc">Price: Low → High</option>
            <option value="desc">Price: High → Low</option>
          </select>
        </div>

        {/* ── Grid ─────────────────────────────────────────────── */}
        <div className={`${px} py-10 sm:py-16`}>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-border">
                  <div className="aspect-[3/4] bg-surface animate-pulse" />
                  <div className="px-5 pt-4 pb-6 border-t border-border space-y-2">
                    <div className="h-4 bg-surface animate-pulse w-3/4" />
                    <div className="h-3 bg-surface animate-pulse w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="py-24 sm:py-32 text-center border border-border">
              <p className="font-display text-xl sm:text-2xl text-ink-2 mb-6">
                {activeCategory ? 'No pieces in this category.' : 'Collection coming soon.'}
              </p>
              {activeCategory && (
                <button
                  onClick={() => setActiveCategory('')}
                  className="font-body text-[11px] text-ink-3 tracking-[0.18em] uppercase hover:text-ink-2 transition-colors"
                >
                  ← View all pieces
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {displayed.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
