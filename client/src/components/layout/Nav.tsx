import { Link } from 'react-router-dom';

export default function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg border-b border-border">
      <div className="flex items-center justify-between px-8 md:px-16 h-[72px]">
        <Link to="/" className="font-display text-[1.35rem] text-ink leading-none tracking-tight">
          Mani Jewellery
        </Link>

        <div className="flex items-center gap-8">
          <Link
            to="/shop"
            className="font-body text-[11px] text-ink-2 tracking-[0.18em] uppercase hover:text-ink transition-colors duration-200"
          >
            Shop
          </Link>
          <Link
            to="/custom"
            className="font-body text-[11px] text-ink-2 tracking-[0.18em] uppercase hover:text-ink transition-colors duration-200"
          >
            Custom
          </Link>
          <Link
            to="/cart"
            className="font-body text-[11px] text-ink-2 tracking-[0.18em] uppercase hover:text-ink transition-colors duration-200"
          >
            Cart
          </Link>
        </div>
      </div>
    </nav>
  );
}
