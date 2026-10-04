import React from 'react';
import { Receipt, Truck } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

export function PaymentSection({ 
  subtotal, 
  shippingCost, 
  onShippingCostChange,
  grandTotal, 
  paid, 
  onPaidChange, 
  change, 
  onPayment, 
  loading 
}) {
  return (
    <div className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-neutral-900 dark:text-white space-y-4 shadow-xs">
      {/* Subtotal */}
      <div className="flex justify-between text-xs text-neutral-500">
        <span>Subtotal:</span>
        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{formatCurrency(subtotal)}</span>
      </div>

      {/* Ongkir */}
      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800 space-y-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          <Truck size={14} className="text-neutral-500" />
          <span>Biaya Pengiriman:</span>
        </label>

        <input
          type="number"
          value={shippingCost || ''}
          onChange={(e) => onShippingCostChange(parseInt(e.target.value) || 0)}
          className="w-full rounded-lg px-3 py-1.5 text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
          placeholder="0"
          min="0"
        />

        <div className="flex gap-1.5 pt-1">
          {[5000, 10000, 15000, 20000].map(value => (
            <button
              key={value}
              type="button"
              onClick={() => onShippingCostChange(value)}
              className="flex-1 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              {value / 1000}k
            </button>
          ))}
        </div>
      </div>

      {/* Grand Total */}
      <div className="flex justify-between text-sm font-bold pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
        <span>TOTAL TAGIHAN:</span>
        <span className="font-mono">{formatCurrency(grandTotal)}</span>
      </div>

      {/* Uang Bayar */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
          Nominal Pembayaran:
        </label>
        <input
          type="number"
          value={paid}
          onChange={(e) => onPaidChange(e.target.value)}
          className="w-full rounded-xl px-3 py-2 text-base font-bold text-right bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white font-mono"
          placeholder="0"
        />
      </div>

      {/* Kembalian */}
      {parseInt(paid) >= grandTotal && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl p-3 flex justify-between items-center text-xs">
          <span className="font-semibold text-emerald-800 dark:text-emerald-300">Kembalian:</span>
          <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono">
            {formatCurrency(change)}
          </span>
        </div>
      )}

      {/* Button Bayar */}
      <button
        onClick={onPayment}
        disabled={parseInt(paid) < grandTotal || loading}
        className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
      >
        <Receipt size={16} />
        <span>{loading ? 'Memproses Transaksi...' : 'Bayar & Selesaikan'}</span>
      </button>
    </div>
  );
}
