import React from 'react';
import { AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

export function DeleteConfirmModal({ product, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs antialiased">
      <div className="w-full max-w-sm rounded-2xl bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 px-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <AlertCircle size={18} />
          <h2 className="text-sm font-bold tracking-tight">Nonaktifkan Produk</h2>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Apakah Anda yakin ingin menonaktifkan menu produk ini?
          </p>

          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
            <div className="font-semibold text-xs text-neutral-900 dark:text-white">{product.name}</div>
            <div className="text-xs text-neutral-500 font-mono mt-0.5">
              {formatCurrency(product.price)}
            </div>
          </div>

          <p className="text-[11px] text-neutral-400">
            Produk akan disembunyikan dari kasir, namun data riwayat transaksi lama tetap aman.
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 px-5 border-t border-neutral-100 dark:border-neutral-800 flex gap-2.5 bg-neutral-50/50 dark:bg-neutral-900/50">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-medium text-xs border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-medium text-xs bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
          >
            {loading ? 'Memproses...' : 'Ya, Nonaktifkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
