import React, { useState, useEffect, useCallback } from 'react';
import { Receipt, Calendar, Truck, Package, X, Printer, Search, TrendingUp, ShoppingBag, BarChart2, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { formatCurrency } from '../utils/formatCurrency';
import { handleError } from '../utils/errorHandler';

const FILTERS = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'week', label: '7 Hari' },
  { key: 'month', label: '30 Hari' },
  { key: 'all', label: 'Semua' },
];

export function TransactionsPage({ printerService, printerConnected, onShowToast }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filter, setFilter] = useState('today');
  const [search, setSearch] = useState('');
  const [printing, setPrinting] = useState(false);
  const [showMoney, setShowMoney] = useState(false);

  const displayMoney = useCallback((val) => showMoney ? formatCurrency(val) : 'Rp •••••••', [showMoney]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await transactionService.getAll();
      setTransactions(data);
    } catch (error) {
      handleError(error, 'Gagal memuat transaksi', onShowToast);
    } finally {
      setLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const filterTransactions = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return transactions.filter(t => {
      const transDate = new Date(t.created_at);
      const matchDate =
        filter === 'today' ? transDate >= today :
        filter === 'week' ? transDate >= weekAgo :
        filter === 'month' ? transDate >= monthAgo : true;
      const matchSearch = !search || t.transaction_no?.toLowerCase().includes(search.toLowerCase());
      return matchDate && matchSearch;
    });
  };

  const filteredTransactions = filterTransactions();
  const stats = {
    count: filteredTransactions.length,
    total: filteredTransactions.reduce((s, t) => s + Number(t.grand_total), 0),
    avg: filteredTransactions.length > 0
      ? filteredTransactions.reduce((s, t) => s + Number(t.grand_total), 0) / filteredTransactions.length
      : 0
  };

  const formatDate = d => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = d => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const printFallback = (data) => {
    const printWindow = window.open('', '', 'width=300,height=600');
    const itemsHtml = (data.items || []).map(item => `
      <tr><td>${item.product_name || item.name}</td><td align="right">${item.qty}x</td><td align="right">${formatCurrency(item.price * item.qty)}</td></tr>
    `).join('');
    printWindow.document.write(`
      <html><head><title>Nota - ${data.transactionNo}</title>
      <style>body{font-family:monospace;font-size:12px;margin:20px}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:10px 0}table{width:100%}</style>
      </head><body>
      <div class="center bold" style="font-size:16px">BAKE BLISS</div>
      <div class="center">Jl. Ahmad Yani No. 24A</div><div class="center">Magelang</div>
      <div class="line"></div><div>No: ${data.transactionNo}</div>
      <div>${new Date().toLocaleString('id-ID')}</div><div class="line"></div>
      <table>${itemsHtml}</table><div class="line"></div>
      <table>
        <tr><td>Subtotal:</td><td align="right">${formatCurrency(data.subtotal)}</td></tr>
        ${data.shippingCost > 0 ? `<tr><td>Ongkir:</td><td align="right">${formatCurrency(data.shippingCost)}</td></tr>` : ''}
        <tr class="bold"><td>TOTAL:</td><td align="right">${formatCurrency(data.grandTotal)}</td></tr>
        <tr><td>BAYAR:</td><td align="right">${formatCurrency(data.paid)}</td></tr>
        <tr><td>KEMBALI:</td><td align="right">${formatCurrency(data.change)}</td></tr>
      </table>
      <div class="line"></div><div class="center">0881-0124-64949</div>
      <div class="center" style="margin-top:6px;">Terima kasih atas kunjungan Anda</div></body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleReprint = async (transaction) => {
    setPrinting(true);
    try {
      const printData = {
        transactionNo: transaction.transaction_no,
        items: transaction.items,
        subtotal: transaction.total,
        shippingCost: transaction.shipping_cost || 0,
        grandTotal: transaction.grand_total,
        paid: transaction.paid,
        change: transaction.change
      };
      let printed = false;
      if (printerConnected) {
        try { await printerService.print(printData); printed = true; onShowToast('Nota dicetak', 'success'); } catch { /* fallback */ }
      }
      if (!printed) { printFallback(printData); onShowToast('Nota dibuka di window baru', 'info'); }
    } catch (error) {
      handleError(error, 'Gagal cetak ulang nota', onShowToast);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Riwayat Transaksi</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Arsip dan cetak ulang nota penjualan kasir</p>
          </div>
          <button 
            onClick={() => setShowMoney(!showMoney)}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            title={showMoney ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
          >
            {showMoney ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 size={16} className="text-neutral-400" />
            <span className="text-xs text-neutral-500 font-medium">Transaksi</span>
          </div>
          <p className="text-xl font-bold font-mono text-neutral-900 dark:text-white">{stats.count}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <span className="text-xs text-neutral-500 font-medium">Total</span>
          </div>
          <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate">{displayMoney(stats.total)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag size={16} className="text-neutral-400" />
            <span className="text-xs text-neutral-500 font-medium">Rata-rata</span>
          </div>
          <p className="text-base font-bold font-mono text-neutral-900 dark:text-white truncate">{displayMoney(stats.avg)}</p>
        </div>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl font-medium text-xs whitespace-nowrap transition-colors cursor-pointer border ${
                filter === f.key
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="text" value={search} placeholder="Cari nomor nota transaksi..."
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-xs shadow-xs"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-18 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-2xl animate-pulse" />)}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="py-16 text-center text-neutral-400 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800">
          <Receipt size={36} className="mx-auto mb-2 text-neutral-300 dark:text-neutral-700" />
          <p className="text-xs">{search ? 'Transaksi tidak ditemukan' : filter !== 'all' ? 'Belum ada transaksi di periode ini' : 'Belum ada transaksi'}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTransactions.map(trx => (
            <div key={trx.id}
              onClick={() => setSelectedTransaction(trx)}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer transition-all hover:shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                      {trx.transaction_no}
                    </span>
                    {trx.shipping_cost > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded">
                        <Truck size={10} /> Ongkir
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                    <Calendar size={11} />
                    <span>{formatDate(trx.created_at)} · {formatTime(trx.created_at)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Package size={11} /> {trx.items?.length || 0} item</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-sm text-neutral-900 dark:text-white font-mono">{displayMoney(trx.grand_total)}</p>
                  </div>
                  <ChevronRight size={16} className="text-neutral-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detail */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 antialiased">
          <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200 dark:border-neutral-800">
            {/* Header */}
            <div className="p-4 px-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white dark:bg-neutral-900">
              <div>
                <h2 className="text-sm font-bold tracking-tight">Detail Transaksi</h2>
                <p className="text-xs font-mono text-neutral-400 mt-0.5">{selectedTransaction.transaction_no}</p>
              </div>
              <button onClick={() => setSelectedTransaction(null)}
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Waktu */}
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <Calendar size={13} />
                <span>{formatDate(selectedTransaction.created_at)} · {formatTime(selectedTransaction.created_at)}</span>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-[11px] font-semibold mb-2 text-neutral-400 uppercase tracking-wider font-mono">Daftar Produk</h3>
                <div className="space-y-1.5 divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {selectedTransaction.items?.map((item, i) => (
                    <div key={i} className="pt-1.5 first:pt-0 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-white">{item.product_name || item.name}</p>
                        <p className="text-[11px] text-neutral-400 font-mono">{formatCurrency(item.price)} × {item.qty}</p>
                      </div>
                      <p className="font-bold font-mono text-neutral-900 dark:text-white">
                        {formatCurrency(item.price * item.qty)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3.5 space-y-1.5 text-xs border border-neutral-200/60 dark:border-neutral-700/60">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 font-mono">{formatCurrency(selectedTransaction.total)}</span>
                </div>
                {selectedTransaction.shipping_cost > 0 && (
                  <div className="flex justify-between text-neutral-500">
                    <span className="flex items-center gap-1"><Truck size={11} /> Ongkir</span>
                    <span className="font-mono">{formatCurrency(selectedTransaction.shipping_cost)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white">
                  <span>Total Tagihan</span>
                  <span className="font-mono">{formatCurrency(selectedTransaction.grand_total)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Nominal Bayar</span>
                  <span className="font-mono">{formatCurrency(selectedTransaction.paid)}</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                  <span>Kembalian</span>
                  <span className="font-mono">{formatCurrency(selectedTransaction.change)}</span>
                </div>
              </div>

              {/* Reprint */}
              <button onClick={() => handleReprint(selectedTransaction)} disabled={printing}
                className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white font-semibold text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-colors cursor-pointer shadow-xs">
                <Printer size={15} />
                <span>{printing ? 'Mencetak...' : 'Cetak Ulang Nota'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}