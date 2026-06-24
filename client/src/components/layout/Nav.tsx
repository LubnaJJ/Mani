import { useState } from 'react';
import { Link } from 'react-router-dom';

const linkCls =
  'font-body text-[11px] text-ink-2 tracking-[0.18em] uppercase hover:text-ink transition-colors duration-200';

export default function Nav() {
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg border-b border-border">
      <div className="flex items-center justify-between px-5 sm:px-8 md:px-16 h-[72px]">
        <Link to="/" onClick={close} className="font-display text-[1.35rem] text-ink leading-none tracking-tight">
          Mani Jewellery
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/shop" className={linkCls}>Shop</Link>
          <Link to="/custom" className={linkCls}>Custom</Link>
          <Link to="/cart" className={linkCls}>Cart</Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="md:hidden font-body text-ink-2 text-2xl leading-none w-10 h-10 flex items-center justify-center hover:text-ink transition-colors duration-200"
        >
          {open ? '×' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-border bg-bg">
          <div className="flex flex-col px-5 py-4 gap-0">
            {[
              { to: '/shop', label: 'Shop' },
              { to: '/custom', label: 'Custom' },
              { to: '/cart', label: 'Cart' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={close}
                className="font-body text-[11px] text-ink-2 tracking-[0.18em] uppercase hover:text-ink transition-colors duration-200 py-4 border-b border-border last:border-0"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
