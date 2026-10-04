import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Search, Receipt, Printer, Package, Check, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabase';
import { transactionService } from '../services/transactionService';
import { formatCurrency } from '../utils/formatCurrency';
import { handleError } from '../utils/errorHandler';

export function CashierPage({ printerService, printerConnected, onShowToast }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [paid, setPaid] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [quickAmounts] = useState([50000, 100000, 200000]);

  const loadData = useCallback(async () => {
    setProductLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*').eq('active', true).order('name', { ascending: true }),
        supabase.from('categories').select('*').order('id', { ascending: true })
      ]);
      if (prodRes.error) throw prodRes.error;
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (error) {
      handleError(error, 'Gagal memuat katalog produk', onShowToast);
    } finally {
      setProductLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'all' || p.category_id === Number(selectedCategory);
    return matchSearch && matchCat;
  });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev
      .map(item => item.id === id ? { ...item, qty: item.qty + delta } : item)
      .filter(item => item.qty > 0)
    );
  };

  const removeItem = (id) => setCart(prev => prev.filter(item => item.id !== id));
  const clearCart = () => { setCart([]); setPaid(''); setShippingCost(0); };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const grandTotal = subtotal + (Number(shippingCost) || 0);
  const paidAmount = parseInt(paid) || 0;
  const change = paidAmount >= grandTotal ? paidAmount - grandTotal : 0;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const printFallback = (data) => {
    const printWindow = window.open('', '', 'width=320,height=600');
    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 2px 0;">${item.name}</td>
        <td align="right" style="padding: 2px 0;">${item.qty}x</td>
        <td align="right" style="padding: 2px 0;">${formatCurrency(item.price * item.qty)}</td>
      </tr>
    `).join('');
    printWindow.document.write(`
      <html><head><title>Struk - ${data.transactionNo}</title>
      <style>body{font-family:monospace;font-size:12px;margin:16px;color:#111}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #444;margin:8px 0}table{width:100%}</style>
      </head><body>
      <div class="center bold" style="font-size:15px">BAKEBLISS POS</div>
      <div class="center">Outlet Resmi & Kafe</div>
      <div class="line"></div>
      <div>No: ${data.transactionNo}</div>
      <div>Waktu: ${new Date().toLocaleString('id-ID')}</div>
      <div class="line"></div>
      <table>${itemsHtml}</table>
      <div class="line"></div>
      <table>
        <tr><td>Subtotal:</td><td align="right">${formatCurrency(data.subtotal)}</td></tr>
        ${data.shippingCost > 0 ? `<tr><td>Ongkir:</td><td align="right">${formatCurrency(data.shippingCost)}</td></tr>` : ''}
        <tr class="bold"><td>TOTAL:</td><td align="right">${formatCurrency(data.grandTotal)}</td></tr>
        <tr><td>BAYAR:</td><td align="right">${formatCurrency(data.paid)}</td></tr>
        <tr><td>KEMBALI:</td><td align="right">${formatCurrency(data.change)}</td></tr>
      </table>
      <div class="line"></div>
      <div class="center" style="font-size:11px;margin-top:10px;">Terima kasih atas kunjungan Anda</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const processPayment = async () => {
    if (cart.length === 0) { onShowToast('Keranjang transaksi masih kosong', 'error'); return; }
    if (paidAmount < grandTotal) { onShowToast('Nominal pembayaran kurang dari total tagihan', 'error'); return; }

    setLoading(true);
    try {
      const trx = await transactionService.create({
        total: subtotal,
        shipping_cost: shippingCost,
        grand_total: grandTotal,
        paid: paidAmount,
        change,
        items: cart
      });

      const printData = {
        transactionNo: trx.transaction_no,
        items: cart,
        subtotal,
        shippingCost,
        grandTotal,
        paid: paidAmount,
        change
      };

      let printed = false;
      if (printerConnected) {
        try { await printerService.print(printData); printed = true; } catch { /* fallback */ }
      }
      if (!printed) printFallback(printData);

      clearCart();
      onShowToast(`Transaksi berhasil diproses. Kembalian: ${formatCurrency(change)}`, 'success');
    } catch (error) {
      handleError(error, 'Gagal memproses transaksi kasir', onShowToast);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full antialiased">
      
      {/* LEFT — Product Catalog */}
      <div className="flex-1 space-y-4 min-w-0">
        
        {/* Search & Category Header */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              placeholder="Cari menu produk atau minuman..."
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-sm transition-all shadow-xs"
            />
          </div>

          {/* Category Filter Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                  selectedCategory === 'all'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                    : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                }`}
              >
                Semua Kategori
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(String(cat.id))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                    selectedCategory === String(cat.id)
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products Grid */}
        {productLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-44 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800">
            <Package size={36} className="mb-2 text-neutral-300 dark:text-neutral-700" />
            <p className="text-sm font-medium">{search ? 'Produk tidak ditemukan' : 'Tidak ada produk dalam kategori ini'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProducts.map(product => {
              const inCart = cart.find(i => i.id === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`group relative rounded-xl text-left transition-all duration-150 active:scale-[0.98] border cursor-pointer overflow-hidden flex flex-col justify-between ${
                    inCart
                      ? 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-900 dark:border-white shadow-xs ring-1 ring-neutral-900 dark:ring-white'
                      : 'bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs'
                  }`}
                >
                  {/* Item Count Badge */}
                  {inCart && (
                    <span className="absolute top-2.5 right-2.5 z-10 w-5 h-5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-[11px] flex items-center justify-center font-bold shadow-xs">
                      {inCart.qty}
                    </span>
                  )}

                  {/* Thumbnail / Image */}
                  <div className="w-full h-28 bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400">
                        <Package size={22} />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-3">
                    <p className="font-semibold text-xs text-neutral-900 dark:text-white leading-snug line-clamp-2 mb-1.5">
                      {product.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT — Cart & Checkout Drawer */}
      <div className="lg:w-80 xl:w-96 flex flex-col gap-4 shrink-0">
        
        {/* Cart Container */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-neutral-700 dark:text-neutral-300" />
              <h3 className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">Pesanan Saat Ini</h3>
              {cartCount > 0 && (
                <span className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {cartCount}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button 
                onClick={clearCart} 
                className="text-xs text-neutral-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="p-3 space-y-2 max-h-72 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-xs">
                <ShoppingCart size={28} className="mx-auto mb-2 opacity-30" />
                <p>Belum ada produk dipilih</p>
              </div>
            ) : cart.map(item => (
              <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-[11px] text-neutral-500">{formatCurrency(item.price * item.qty)}</p>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={() => updateQty(item.id, -1)}
                    className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="w-5 text-center text-xs font-bold font-mono">{item.qty}</span>
                  <button 
                    onClick={() => updateQty(item.id, 1)}
                    className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                  >
                    <Plus size={11} />
                  </button>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="w-6 h-6 rounded-md text-neutral-400 hover:text-rose-600 flex items-center justify-center transition-colors ml-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Section */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 space-y-4 bg-neutral-50/50 dark:bg-neutral-900/50">
              
              {/* Order Calculations */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-500">
                  <span>Biaya Ongkir / Layanan</span>
                  <input
                    type="number"
                    value={shippingCost || ''}
                    min={0}
                    placeholder="0"
                    onChange={e => setShippingCost(Number(e.target.value) || 0)}
                    className="w-24 text-right px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white text-xs font-medium"
                  />
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-neutral-200/60 dark:border-neutral-800 text-neutral-900 dark:text-white">
                  <span>Total Tagihan</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Payment Input */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                  Nominal Diterima
                </label>
                <input
                  type="number"
                  value={paid}
                  placeholder="0"
                  min={0}
                  onChange={e => setPaid(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-base font-bold text-right"
                />

                {/* Quick amount shortcuts */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaid(String(grandTotal))}
                    className="py-1 text-[11px] font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                  >
                    Uang Pas
                  </button>
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPaid(String(amt))}
                      className="py-1 text-[11px] font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                    >
                      {amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kembalian & Kurang status */}
              {paidAmount >= grandTotal && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl p-3 flex justify-between items-center text-xs">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">Kembalian</span>
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                    {formatCurrency(change)}
                  </span>
                </div>
              )}

              {paidAmount > 0 && paidAmount < grandTotal && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/80 rounded-xl p-3 flex justify-between items-center text-xs">
                  <span className="font-semibold text-rose-800 dark:text-rose-300">Kekurangan</span>
                  <span className="text-base font-bold text-rose-700 dark:text-rose-400 font-mono">
                    {formatCurrency(grandTotal - paidAmount)}
                  </span>
                </div>
              )}

              {/* Checkout Button */}
              <button
                onClick={processPayment}
                disabled={loading || paidAmount < grandTotal || cart.length === 0}
                className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {loading ? (
                  <span>Memproses Transaksi...</span>
                ) : (
                  <>
                    <Receipt size={16} />
                    <span>Selesaikan Transaksi</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}