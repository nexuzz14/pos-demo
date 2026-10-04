import React, { useState } from 'react';
import { X } from 'lucide-react';

export function ProductForm({ product, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price || '',
    active: product?.active !== undefined ? product.active : true
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nama produk wajib diisi';
    if (!formData.price || formData.price <= 0)
      newErrors.price = 'Harga harus lebih dari 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        name: formData.name.trim(),
        price: parseInt(formData.price),
        active: formData.active
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 antialiased">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 shadow-2xl">
        
        {/* Header */}
        <div className="p-4 px-5 flex items-center justify-between sticky top-0 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <h2 className="text-base font-bold tracking-tight">
            {product ? 'Edit Menu Produk' : 'Tambah Menu Baru'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Nama */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
              Nama Produk <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full rounded-xl px-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-800 border text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all ${
                errors.name ? 'border-rose-500' : 'border-neutral-200 dark:border-neutral-700'
              }`}
              placeholder="Contoh: Butter Croissant"
              autoFocus
            />
            {errors.name && (
              <p className="text-rose-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Harga */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
              Harga Jual (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className={`w-full rounded-xl px-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-800 border text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all font-mono ${
                errors.price ? 'border-rose-500' : 'border-neutral-200 dark:border-neutral-700'
              }`}
              placeholder="25000"
              min="0"
            />
            {errors.price && (
              <p className="text-rose-500 text-xs mt-1">{errors.price}</p>
            )}
          </div>

          {/* Active Status Checkbox */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 cursor-pointer"
            />
            <label htmlFor="active" className="flex-1 cursor-pointer">
              <div className="text-xs font-semibold text-neutral-900 dark:text-white">Status Produk Aktif</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Menu aktif akan langsung tersedia di halaman kasir
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl font-medium text-xs border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl font-medium text-xs bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
            >
              {loading ? 'Menyimpan...' : product ? 'Simpan Perubahan' : 'Tambah Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
