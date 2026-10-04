import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Receipt, LogOut, 
  Sun, Moon, Printer, Wallet, FlaskConical, UserCog, Store, ChevronRight 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from './Toast';

export function Layout({ printerService, printerConnected, connectPrinter, loading, toast, setToast }) {
  const { role, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { id: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['admin', 'manager'] },
    { id: '/cashier', label: 'Kasir POS', icon: <ShoppingCart size={18} />, roles: ['admin', 'manager', 'cashier'] },
    { id: '/menu', label: 'Menu Produk', icon: <Package size={18} />, roles: ['admin', 'manager'] },
    { id: '/transactions', label: 'Riwayat Transaksi', icon: <Receipt size={18} />, roles: ['admin', 'manager', 'cashier'] },
    { id: '/cashflow', label: 'Arus Kas', icon: <Wallet size={18} />, roles: ['admin', 'manager'] },
    { id: '/ingredients', label: 'Bahan Baku', icon: <FlaskConical size={18} />, roles: ['admin', 'manager'] },
    { id: '/users', label: 'Pengguna', icon: <UserCog size={18} />, roles: ['admin'] },
  ].filter(item => item.roles.includes(role || 'cashier'));

  return (
    <div className="min-h-screen bg-neutral-100/70 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col md:flex-row antialiased selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900">
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200/80 dark:border-neutral-800 h-screen sticky top-0 shrink-0">
        
        {/* Brand Header */}
        <div className="p-5 border-b border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-xs">
              <Store size={18} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">BakeBliss</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 uppercase font-semibold">POS</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">Store Management</p>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Role Akun</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono tracking-wide font-medium uppercase border ${
              role === 'admin'
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60'
                : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
            }`}>
              {role || 'Cashier'}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.id;
            return (
              <Link
                key={item.id}
                to={item.id}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white dark:text-neutral-900' : 'text-neutral-500 dark:text-neutral-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight size={14} className="opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer Utilities */}
        <div className="p-3 border-t border-neutral-200/80 dark:border-neutral-800 space-y-1">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            <span>Mode {theme === 'light' ? 'Gelap' : 'Terang'}</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white dark:bg-neutral-900 px-4 py-3 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center">
              <Store size={14} />
            </div>
            <span className="font-bold text-sm tracking-tight">BakeBliss</span>
          </div>
          
          <div className="flex gap-1.5 items-center">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {(location.pathname === '/cashier' || location.pathname === '/transactions') && (
              <button
                onClick={connectPrinter}
                disabled={loading}
                className={`p-2 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                  printerConnected 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Printer size={15} />
              </button>
            )}
            
            <button 
              onClick={handleLogout} 
              className="p-2 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex bg-white dark:bg-neutral-900 px-6 py-3 items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 sticky top-0 z-10">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            Outlet: <span className="text-neutral-900 dark:text-white font-semibold">BakeBliss Bakery & Coffee</span>
          </div>

          <div className="flex items-center gap-4">
            {(location.pathname === '/cashier' || location.pathname === '/transactions') && (
              <div className="flex items-center gap-2">
                {!printerConnected ? (
                  <button
                    onClick={connectPrinter}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
                    <Printer size={14} />
                    <span>{loading ? 'Menghubungkan...' : 'Hubungkan Printer'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <Printer size={14} />
                    <span>Printer Siap</span>
                  </div>
                )}
              </div>
            )}

            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800"></div>

            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {user?.email || 'user@bakebliss.com'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex z-30 pb-safe shadow-lg">
          {navItems.map(item => {
            const isActive = location.pathname === item.id;
            return (
              <Link
                key={item.id}
                to={item.id}
                className={`flex-1 py-2.5 px-1 flex flex-col items-center gap-1 transition-colors ${
                  isActive
                    ? 'text-neutral-900 dark:text-white font-semibold'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                <span className={isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}>
                  {item.icon}
                </span>
                <span className="text-[10px] truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
