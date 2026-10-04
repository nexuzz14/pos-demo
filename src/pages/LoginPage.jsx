import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/cashier'); // or '/' depending on role, but cashier is safe
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
      setError(err.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">🍰 BakeBliss</h1>
            <p className="text-gray-500 dark:text-gray-400">Masuk ke sistem POS</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none transition-all"
                placeholder="admin@bakebliss.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          {/* Quick Fill Akun Demo */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-3 font-medium">
              💡 Klik untuk isi akun demo otomatis:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => { setEmail('admin@bakebliss.com'); setPassword('demo123456'); }}
                className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium transition-all text-center border border-indigo-200/50 dark:border-indigo-800/50 cursor-pointer"
              >
                <div className="font-bold">👑 Admin Demo</div>
                <div className="text-[10px] opacity-75 mt-0.5">admin@bakebliss.com</div>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('kasir@bakebliss.com'); setPassword('demo123456'); }}
                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-medium transition-all text-center border border-emerald-200/50 dark:border-emerald-800/50 cursor-pointer"
              >
                <div className="font-bold">🛒 Kasir Demo</div>
                <div className="text-[10px] opacity-75 mt-0.5">kasir@bakebliss.com</div>
              </button>
            </div>
            <p className="text-[11px] text-center text-gray-400 dark:text-gray-500 mt-2.5">
              Password default: <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">demo123456</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
