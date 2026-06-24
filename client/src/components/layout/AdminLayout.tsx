import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/custom-cms', label: 'Custom CMS' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem('admin_credentials');
    navigate('/admin');
  }

  const navLinkCls = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-3 px-4 py-2.5 font-body text-[11px] tracking-[0.18em] uppercase transition-colors duration-150',
      isActive ? 'text-white bg-white/8' : 'text-white/45 hover:text-white/80',
    ].join(' ');

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={[
          'fixed top-0 left-0 h-screen w-56 bg-ink flex flex-col z-40 transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="px-8 py-8 border-b border-white/10">
          <span className="font-display text-xl text-white leading-none tracking-tight block">
            Mani
          </span>
          <span className="font-body text-[9px] text-white/40 tracking-[0.28em] uppercase mt-1 block">
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={navLinkCls}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'w-px h-3 transition-colors duration-150',
                      isActive ? 'bg-accent' : 'bg-transparent',
                    ].join(' ')}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-4 py-6 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full text-left font-body text-[11px] tracking-[0.18em] uppercase text-white/30 hover:text-white/60 transition-colors duration-150"
          >
            <span className="w-px h-3 bg-transparent" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="flex-1 min-h-screen md:ml-56">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 bg-bg border-b border-border px-5 h-14 flex items-center justify-between">
          <span className="font-display text-lg text-ink leading-none tracking-tight">
            Mani
          </span>
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="font-body text-ink-2 text-2xl leading-none w-10 h-10 flex items-center justify-center hover:text-ink transition-colors duration-200"
          >
            ☰
          </button>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
