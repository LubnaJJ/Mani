import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Product } from '../../types';
import { ApiResponse } from '../../types';
import Nav from '../../components/layout/Nav';
import Footer from '../../components/layout/Footer';
import ProductCard from '../../components/shop/ProductCard';

const px = 'px-5 sm:px-8 md:px-16 lg:px-24';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiResponse<Product[]>>('/products')
      .then((res) => {
        if (res.data.success && res.data.data) {
          setProducts(res.data.data.slice(0, 8));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <Nav />

      <main className="pt-[72px]">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-[55%_45%] min-h-[calc(100vh-72px)] border-b border-border">

          {/* Left — text */}
          <div className="flex flex-col justify-between px-5 sm:px-8 md:px-16 lg:pl-24 lg:pr-16 py-10 sm:py-14 border-b border-border lg:border-b-0 lg:border-r lg:border-border">
            {/* Eyebrow */}
            <div className="flex items-center justify-between">
              <span className="font-body text-[10px] tracking-[0.35em] text-ink-3 uppercase">
                — Handcrafted Collection
              </span>
              <span className="font-body text-[10px] tracking-[0.2em] text-ink-3">
                2026
              </span>
            </div>

            {/* Heading */}
            <div>
              <h1 className="font-display text-[clamp(2.8rem,7vw,8rem)] leading-[1.02] tracking-[-0.02em] text-ink">
                Jewellery<br />
                as Quiet<br />
                Poetry.
              </h1>
            </div>

            {/* Subtitle + CTA */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 sm:gap-8">
              <p className="font-body text-sm text-ink-2 font-light leading-relaxed max-w-[34ch]">
                Handcrafted pieces that carry<br />
                the weight of stillness.
              </p>
              <Link to="/shop" className="btn-primary self-start sm:self-auto">
                Explore Collection
              </Link>
            </div>
          </div>

          {/* Right — video */}
          <div className="relative overflow-hidden aspect-[4/3] sm:aspect-[3/4] lg:aspect-auto lg:h-full">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              style={{ animation: 'hero-fade-in 1.4s ease-out both' }}
            >
              <source src="/hero.mp4" type="video/mp4" />
            </video>
          </div>

        </section>

        {/* ── Featured Pieces ──────────────────────────────────────── */}
        {!loading && products.length > 0 && (
          <section className={`${px} py-14 sm:py-20 border-b border-border`}>
            <div className="flex items-baseline justify-between mb-8 sm:mb-12">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-ink">
                Featured Pieces
              </h2>
              <Link
                to="/shop"
                className="font-body text-[11px] text-ink-2 tracking-[0.18em] uppercase hover:text-ink transition-colors duration-200"
              >
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ── Custom Made ──────────────────────────────────────────── */}
        <section style={{ backgroundColor: '#1C1C1A' }}>
          <div className={`${px} py-16 sm:py-24`}>
            <div className="mb-12 sm:mb-16">
              <p className="font-body text-[10px] tracking-[0.4em] uppercase mb-5" style={{ color: '#D4A5A5' }}>
                — Bespoke Creation —
              </p>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl leading-[1.06] mb-6" style={{ color: '#FAF8F5' }}>
                Made For You
              </h2>
              <p className="font-body text-sm font-light leading-relaxed max-w-[44ch]" style={{ color: '#A8A49F' }}>
                Every bracelet tells your story. Choose your beads,<br />
                your charms, your intention.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-10 mb-12 sm:mb-16">
              {([
                {
                  num: '01',
                  title: 'Choose Your Beads',
                  desc: 'Select from our curated palette of gemstone beads, each carrying its own energy and meaning.',
                  icon: (
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <path d="M 6 30 Q 24 14 42 30" stroke="#D4A5A5" strokeWidth="1" fill="none" strokeLinecap="round"/>
                      <circle cx="6"  cy="30" r="4" stroke="#D4A5A5" strokeWidth="1.5"/>
                      <circle cx="15" cy="24" r="4" stroke="#D4A5A5" strokeWidth="1.5"/>
                      <circle cx="24" cy="22" r="4" stroke="#D4A5A5" strokeWidth="1.5"/>
                      <circle cx="33" cy="24" r="4" stroke="#D4A5A5" strokeWidth="1.5"/>
                      <circle cx="42" cy="30" r="4" stroke="#D4A5A5" strokeWidth="1.5"/>
                    </svg>
                  ),
                },
                {
                  num: '02',
                  title: 'Select Your Charms',
                  desc: 'Add meaningful charms — a sakura bloom, a crescent moon, your initial — each piece of you.',
                  icon: (
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <polygon
                        points="24,4 28.7,17.5 43,17.8 31.6,26.5 35.8,40.2 24,32 12.2,40.2 16.4,26.5 5,17.8 19.3,17.5"
                        stroke="#D4A5A5" strokeWidth="1.5" strokeLinejoin="round"
                      />
                    </svg>
                  ),
                },
                {
                  num: '03',
                  title: 'We Craft It',
                  desc: 'Each bracelet is handstrung by our artisans and delivered with a personal handwritten note.',
                  icon: (
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <line x1="12" y1="40" x2="36" y2="10" stroke="#D4A5A5" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="34.5" cy="11.5" r="3.5" stroke="#D4A5A5" strokeWidth="1.5" fill="none"/>
                      <path d="M 12 40 C 6 32 10 22 7 12" stroke="#D4A5A5" strokeWidth="1" strokeLinecap="round" fill="none"/>
                    </svg>
                  ),
                },
              ] as const).map(({ num, title, desc, icon }) => (
                <div key={num} className="flex flex-col gap-5">
                  <div>{icon}</div>
                  <p className="font-body text-[10px] tracking-[0.3em] uppercase" style={{ color: '#D4A5A5' }}>
                    {num}
                  </p>
                  <h3 className="font-display text-xl" style={{ color: '#FAF8F5' }}>
                    {title}
                  </h3>
                  <p className="font-body text-sm font-light leading-relaxed" style={{ color: '#6B6760' }}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            <Link
              to="/custom"
              className="inline-block font-body text-[11px] tracking-[0.2em] uppercase py-4 px-8 border transition-opacity duration-200 hover:opacity-75"
              style={{ backgroundColor: '#FAF8F5', color: '#1C1C1A', borderColor: '#FAF8F5' }}
            >
              Start Your Custom Order →
            </Link>
          </div>
        </section>

        {/* ── Philosophy ───────────────────────────────────────────── */}
        <section className={`${px} py-16 sm:py-24 bg-surface border-b border-border`}>
          <div className="max-w-xl mx-auto text-center">
            <p className="font-body text-[10px] tracking-[0.4em] text-ink-3 uppercase mb-10 sm:mb-12">
              — The Philosophy —
            </p>

            <blockquote className="font-display text-2xl md:text-[2rem] text-ink leading-[1.4]">
              &ldquo;Each piece begins as<br />
              a breath held still.&rdquo;
            </blockquote>

            <hr className="border-t border-border mt-12 sm:mt-14 mb-8 sm:mb-10" />

            <p className="font-body text-sm text-ink-2 font-light leading-relaxed">
              We make jewellery for those who find beauty in restraint.<br className="hidden sm:block" />
              Every piece is handcrafted to be worn quietly, noticed slowly.
            </p>

            <Link to="/shop" className="btn-outline mt-10 sm:mt-12 inline-block">
              Discover the Collection
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
