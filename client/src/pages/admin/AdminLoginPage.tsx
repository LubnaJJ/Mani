import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const base64 = btoa(`${username}:${password}`);

    try {
      await axios.get('/api/products/admin', {
        headers: { Authorization: `Basic ${base64}` },
      });
      localStorage.setItem('admin_credentials', base64);
      navigate('/admin/dashboard');
    } catch {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-8">
      {/* Logo */}
      <div className="flex flex-col items-center mb-12">
        <span className="font-display text-3xl text-ink tracking-tight">Mani</span>
        <span className="font-body text-[9px] text-ink-2 tracking-[0.3em] uppercase mt-1">
          Jewellery
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm border border-border bg-bg">
        {/* Card header */}
        <div className="border-b border-border px-8 py-5">
          <p className="font-body text-[10px] tracking-[0.3em] text-ink-2 uppercase">
            Admin Access
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-8 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="username"
              className="font-body text-[10px] tracking-[0.2em] text-ink-2 uppercase"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full border border-border bg-bg px-4 py-3 font-body text-sm text-ink placeholder:text-ink-3 outline-none focus:border-ink transition-colors duration-200"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="font-body text-[10px] tracking-[0.2em] text-ink-2 uppercase"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-border bg-bg px-4 py-3 font-body text-sm text-ink placeholder:text-ink-3 outline-none focus:border-ink transition-colors duration-200"
            />
          </div>

          {error && (
            <p className="font-body text-xs text-accent-dark">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-center mt-2 disabled:opacity-40"
          >
            {loading ? 'Verifying…' : 'Sign In'}
          </button>
        </form>
      </div>

      <p className="mt-8 font-body text-[10px] text-ink-3 tracking-[0.15em]">
        ← <a href="/" className="hover:text-ink-2 transition-colors duration-200">Return to shop</a>
      </p>
    </div>
  );
}
