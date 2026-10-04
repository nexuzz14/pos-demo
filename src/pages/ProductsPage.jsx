import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Edit2, Trash2, Check, Search, Box, Archive, Activity } from 'lucide-react';
import { productService } from '../services/productService';
import { ProductForm } from '../components/ProductForm';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { formatCurrency } from '../utils/formatCurrency';
import { handleError } from '../utils/errorHandler';

export function ProductsPage({ onShowToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productService.getAll();
      setProducts(data || []);
    } catch (error) {
      handleError(error, 'Gagal memuat produk', onShowToast);
    } finally {
      setLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleSaveProduct = async (data) => {
    setLoading(true);
    try {
      if (editProduct) {
        await productService.update(editProduct.id, data);
        onShowToast('Produk berhasil diupdate', 'success');
      } else {
        await productService.create(data);
        onShowToast('Produk berhasil ditambahkan', 'success');
      }
      
      await loadProducts();
      setShowForm(false);
      setEditProduct(null);
    } catch (error) {
      handleError(error, 'Gagal menyimpan produk', onShowToast);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    setLoading(true);
    try {
      await productService.softDelete(deleteProduct.id);
      onShowToast('Produk berhasil dinonaktifkan', 'success');
      await loadProducts();
      setDeleteProduct(null);
    } catch (error) {
      handleError(error, 'Gagal menghapus produk', onShowToast);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateProduct = async (product) => {
    try {
      await productService.update(product.id, { active: true });
      onShowToast('Produk berhasil diaktifkan', 'success');
      await loadProducts();
    } catch (error) {
      handleError(error, 'Gagal mengaktifkan produk', onShowToast);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchFilter = 
      filter === 'all' ? true : 
      filter === 'active' ? p.active : !p.active;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    total: products.length,
    active: products.filter(p => p.active).length,
    inactive: products.filter(p => !p.active).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Kelola Menu</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Daftar produk aktif dan pengaturan harga</p>
        </div>
        <button
          onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
        >
          <Plus size={16} />
          <span>Tambah Menu</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-4.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400">
              <Box size={18} />
            </div>
            <span className="text-xs font-medium text-neutral-500">Total Produk</span>
          </div>
          <p className="text-xl font-bold font-mono text-neutral-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Activity size={18} />
            </div>
            <span className="text-xs font-medium text-neutral-500">Menu Aktif</span>
          </div>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{stats.active}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-400">
              <Archive size={18} />
            </div>
            <span className="text-xs font-medium text-neutral-500">Nonaktif</span>
          </div>
          <p className="text-xl font-bold font-mono text-neutral-400">{stats.inactive}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex gap-1.5">
          {['all', 'active', 'inactive'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl font-medium text-xs capitalize transition-colors cursor-pointer border ${
                filter === f
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
              }`}
            >
              {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Nonaktif'}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk menu..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-xs transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-400">
            <Package size={40} className="mx-auto mb-3 opacity-30 animate-pulse" />
            <p className="text-xs">Memuat katalog produk...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">
            <Package size={44} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Tidak ada produk ditemukan</p>
            <p className="text-xs text-neutral-500 mt-1">Coba sesuaikan pencarian atau filter kategori Anda.</p>
            {!search && filter === 'all' && (
              <button 
                onClick={() => setShowForm(true)} 
                className="mt-4 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
              >
                Tambah Produk Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                className={`p-4 flex items-center justify-between transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 ${
                  !product.active ? 'opacity-60 bg-neutral-50/50 dark:bg-neutral-800/30' : ''
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 overflow-hidden flex items-center justify-center shrink-0">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={20} className="text-neutral-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-neutral-900 dark:text-white flex items-center gap-2">
                      {product.name}
                      {!product.active && (
                        <span className="text-[10px] uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-500 font-mono font-medium">
                          Nonaktif
                        </span>
                      )}
                    </h3>
                    <p className="text-neutral-900 dark:text-white font-mono font-bold text-xs mt-0.5">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {!product.active && (
                    <button 
                      onClick={() => handleActivateProduct(product)} 
                      className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 transition-colors cursor-pointer" 
                      title="Aktifkan"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button 
                    onClick={() => { setEditProduct(product); setShowForm(true); }} 
                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer" 
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  {product.active && (
                    <button 
                      onClick={() => setDeleteProduct(product)} 
                      className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer" 
                      title="Nonaktifkan"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ProductForm product={editProduct} onSave={handleSaveProduct} onCancel={() => { setShowForm(false); setEditProduct(null); }} loading={loading} />
      )}
      {deleteProduct && (
        <DeleteConfirmModal product={deleteProduct} onConfirm={handleDeleteProduct} onCancel={() => setDeleteProduct(null)} loading={loading} />
      )}
    </div>
  );
}