import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Shield, ShoppingCart, ArrowRight, Lock, Mail, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/cashier');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-neutral-100/70 dark:bg-neutral-950 p-4 antialiased">
      {/* Floating Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
        title="Toggle Theme"
      >
        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
      </button>

      <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden">
        <div className="p-8">
          
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center mb-3.5 shadow-sm">
              <Store size={24} strokeWidth={2.2} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              BakeBliss POS
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Sistem Kasir & Manajemen Toko
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 p-3.5 rounded-xl mb-6 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
                  placeholder="admin@bakebliss.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer shadow-xs"
            >
              <span>{isLoading ? 'Memproses...' : 'Masuk ke Sistem'}</span>
              {!isLoading && <ArrowRight size={15} />}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-400 dark:text-neutral-500 font-semibold">
                Akun Demo Cepat
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                Sandi: demo123456
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => { setEmail('admin@bakebliss.com'); setPassword('demo123456'); }}
                className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Admin</span>
                  <Shield size={13} className="text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
                </div>
                <div className="text-[11px] text-neutral-500 truncate">admin@bakebliss.com</div>
              </button>

              <button
                type="button"
                onClick={() => { setEmail('kasir@bakebliss.com'); setPassword('demo123456'); }}
                className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Kasir</span>
                  <ShoppingCart size={13} className="text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
                </div>
                <div className="text-[11px] text-neutral-500 truncate">kasir@bakebliss.com</div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
