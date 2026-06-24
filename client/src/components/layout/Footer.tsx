import { Link } from 'react-router-dom';

function InstagramIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#1C1C1A' }}>
      {/* Top border */}
      <div style={{ borderTop: '1px solid #2A2A28' }}>

        {/* Main content */}
        <div className="px-8 md:px-16 lg:px-24 py-16 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">

          {/* Left — brand + Instagram */}
          <div className="flex flex-col gap-5">
            <Link
              to="/"
              className="font-display text-xl leading-none tracking-tight transition-opacity duration-200 hover:opacity-70"
              style={{ color: '#FAF8F5' }}
            >
              Mani Jewellery
            </Link>

            <a
              href="https://instagram.com/mani_jeweller.sl"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 font-body text-[11px] tracking-[0.1em] transition-colors duration-200 group w-fit"
              style={{ color: '#6B6760' }}
            >
              <span className="group-hover:text-[#D4A5A5] transition-colors duration-200">
                <InstagramIcon />
              </span>
              <span className="group-hover:text-[#D4A5A5] transition-colors duration-200">
                @mani_jeweller.sl
              </span>
            </a>
          </div>

          {/* Centre — navigation */}
          <div className="flex flex-col gap-4">
            <p
              className="font-body text-[10px] tracking-[0.3em] uppercase mb-1"
              style={{ color: '#6B6760' }}
            >
              Navigate
            </p>
            <Link
              to="/shop"
              className="font-body text-[12px] tracking-[0.12em] uppercase transition-colors duration-200 hover:opacity-70 w-fit"
              style={{ color: '#FAF8F5' }}
            >
              Shop
            </Link>
            <Link
              to="/cart"
              className="font-body text-[12px] tracking-[0.12em] uppercase transition-colors duration-200 hover:opacity-70 w-fit"
              style={{ color: '#FAF8F5' }}
            >
              Cart
            </Link>
            <Link
              to="/admin"
              className="font-body text-[11px] tracking-[0.12em] uppercase transition-colors duration-200 hover:opacity-50 w-fit mt-2"
              style={{ color: '#6B6760' }}
            >
              Admin
            </Link>
          </div>

          {/* Right — brand line */}
          <div className="flex flex-col gap-4">
            <p
              className="font-body text-[10px] tracking-[0.3em] uppercase mb-1"
              style={{ color: '#6B6760' }}
            >
              About
            </p>
            <p
              className="font-body text-sm font-light leading-relaxed"
              style={{ color: '#FAF8F5' }}
            >
              Handcrafted jewellery<br />
              from Sri Lanka.
            </p>
            <p
              className="font-body text-[11px] leading-relaxed"
              style={{ color: '#6B6760' }}
            >
              Each piece is made by hand,<br />
              worn quietly, noticed slowly.
            </p>
          </div>

        </div>

        {/* Bottom strip */}
        <div
          className="px-8 md:px-16 lg:px-24 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          style={{ borderTop: '1px solid #2A2A28' }}
        >
          <p
            className="font-body text-[10px] tracking-[0.12em]"
            style={{ color: '#6B6760' }}
          >
            © 2026 Mani Jewellery. All rights reserved.
          </p>
          <p
            className="font-body text-[10px] tracking-[0.08em]"
            style={{ color: '#6B6760' }}
          >
            Sri Lanka
          </p>
        </div>

      </div>
    </footer>
  );
}
