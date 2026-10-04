import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { formatCurrency } from '../utils/formatCurrency';
import { exportToExcel } from '../utils/exportExcel';
import {
  PlusCircle, FlaskConical, Download, X, Pencil,
  Trash2, AlertTriangle, ChevronDown, Search, Eye, EyeOff, CheckCircle2
} from 'lucide-react';

const UNITS = ['kg', 'gram', 'liter', 'ml', 'pcs', 'lusin', 'pak', 'sachet', 'botol', 'kaleng'];

const initialForm = {
  name: '',
  unit: 'kg',
  stock: '',
  min_stock: '',
  price_per_unit: '',
};

export function IngredientsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showMoney, setShowMoney] = useState(false);

  const displayMoney = useCallback((val) => showMoney ? formatCurrency(val) : 'Rp •••••••', [showMoney]);

  const fetchIngredients = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setIngredients(data || []);
    } catch (err) {
      console.error('Error fetching ingredients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIngredients(); }, [fetchIngredients]);

  const filtered = ingredients.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchLow = !showLowStockOnly || (Number(i.stock) <= Number(i.min_stock) && Number(i.min_stock) > 0);
    return matchSearch && matchLow;
  });

  const lowStockCount = ingredients.filter(i =>
    Number(i.stock) <= Number(i.min_stock) && Number(i.min_stock) > 0
  ).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const parseDecimal = (val) => Number(String(val).replace(',', '.')) || 0;

      const payload = {
        name: form.name.trim(),
        unit: form.unit,
        stock: parseDecimal(form.stock),
        min_stock: parseDecimal(form.min_stock),
        price_per_unit: parseDecimal(form.price_per_unit),
      };

      if (editId) {
        const { error } = await supabase.from('ingredients').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ingredients').insert(payload);
        if (error) throw error;
      }

      setForm(initialForm);
      setEditId(null);
      setShowForm(false);
      fetchIngredients();
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name,
      unit: item.unit,
      stock: String(item.stock),
      min_stock: String(item.min_stock),
      price_per_unit: String(item.price_per_unit),
    });
    setEditId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('ingredients').delete().eq('id', deleteId);
      if (error) throw error;
      setDeleteId(null);
      fetchIngredients();
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const handleExport = () => {
    const exportData = ingredients.map(i => ({
      'Nama Bahan': i.name,
      'Satuan': i.unit,
      'Stok': Number(i.stock),
      'Min. Stok': Number(i.min_stock),
      'Status': Number(i.stock) <= Number(i.min_stock) && Number(i.min_stock) > 0 ? 'Stok Rendah' : 'Aman',
      'Harga/Unit (Rp)': Number(i.price_per_unit),
      'Total Nilai (Rp)': Number(i.stock) * Number(i.price_per_unit),
    }));
    exportToExcel(exportData, `Bahan-BakeBliss-${new Date().toISOString().split('T')[0]}`, 'Bahan');
  };

  const isLowStock = (item) =>
    Number(item.min_stock) > 0 && Number(item.stock) <= Number(item.min_stock);

  return (
    <div className="space-y-6 antialiased">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Inventaris Bahan</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Manajemen dan pemantauan stok bahan baku dapur</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowMoney(!showMoney)}
            className="p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors shadow-xs cursor-pointer"
            title={showMoney ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
          >
            {showMoney ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-semibold border border-neutral-200/80 dark:border-neutral-800 transition-colors shadow-xs cursor-pointer"
          >
            <Download size={14} />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => { setForm(initialForm); setEditId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>Tambah Bahan</span>
          </button>
        </div>
      </div>

      {/* Low Stock Banner */}
      {lowStockCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs font-medium">
              Perhatian: Ada <strong>{lowStockCount} bahan baku</strong> di bawah batas stok minimum.
            </p>
          </div>
          <button 
            onClick={() => setShowLowStockOnly(v => !v)}
            className="text-xs font-bold underline cursor-pointer hover:opacity-80 shrink-0"
          >
            {showLowStockOnly ? 'Tampilkan Semua' : 'Tampilkan Stok Kritis'}
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Total Jenis Bahan</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1 font-mono">{ingredients.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
            <FlaskConical size={18} />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Bahan Perlu Restock</p>
            <p className={`text-xl font-bold mt-1 font-mono ${lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {lowStockCount}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
            lowStockCount > 0 
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/60 text-amber-600 dark:text-amber-400'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400'
          }`}>
            <AlertTriangle size={18} />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Estimasi Nilai Inventaris</p>
            <p className="text-base font-bold text-neutral-900 dark:text-white mt-1 font-mono">
              {displayMoney(ingredients.reduce((s, i) => s + Number(i.stock) * Number(i.price_per_unit), 0))}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>

      {/* Form Add/Edit */}
      {showForm && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">{editId ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}</h3>
            <button 
              onClick={() => { setShowForm(false); setEditId(null); setForm(initialForm); }}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Nama Bahan Baku</label>
                <input 
                  type="text" 
                  value={form.name} 
                  required
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="cth: Tepung Terigu Segitiga Biru"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-xs font-medium"
                />
              </div>

              {/* Satuan */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Satuan</label>
                <div className="relative">
                  <select 
                    value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white appearance-none pr-10 text-xs font-medium"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                </div>
              </div>

              {/* Harga/Unit */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Harga Beli / Satuan (Rp)</label>
                <input 
                  type="text" 
                  inputMode="decimal" 
                  value={form.price_per_unit} 
                  placeholder="0"
                  onChange={e => setForm(f => ({ ...f, price_per_unit: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-xs font-medium"
                />
              </div>

              {/* Stok */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Stok Saat Ini</label>
                <input 
                  type="text" 
                  inputMode="decimal" 
                  value={form.stock} 
                  placeholder="0"
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-xs font-medium"
                />
              </div>

              {/* Min Stok */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Ambang Batas Min. Stok</label>
                <input 
                  type="text" 
                  inputMode="decimal" 
                  value={form.min_stock} 
                  placeholder="0"
                  onChange={e => setForm(f => ({ ...f, min_stock: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button 
                type="button"
                onClick={() => { setShowForm(false); setEditId(null); setForm(initialForm); }}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Tambah Bahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input 
            type="text" 
            value={search} 
            placeholder="Cari bahan baku..."
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-xs font-medium shadow-xs"
          />
        </div>

        <button 
          onClick={() => setShowLowStockOnly(v => !v)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer shadow-xs ${
            showLowStockOnly
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
              : 'bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <AlertTriangle size={14} />
          <span>Hanya Stok Rendah {lowStockCount > 0 && `(${lowStockCount})`}</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-400 font-medium">Memuat inventaris bahan...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FlaskConical size={36} className="mx-auto mb-2.5 text-neutral-300 dark:text-neutral-700" />
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{search ? 'Bahan baku tidak ditemukan' : 'Belum ada bahan baku'}</p>
            {!search && (
              <button 
                onClick={() => setShowForm(true)}
                className="mt-3 px-3.5 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-xs font-medium cursor-pointer"
              >
                Tambah Bahan
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-neutral-50/80 dark:bg-neutral-800/40 border-b border-neutral-200/80 dark:border-neutral-800">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Nama Bahan</th>
                  <th className="text-center px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Stok Saat Ini</th>
                  <th className="text-center px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">Batas Min.</th>
                  <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden md:table-cell">Harga/Satuan</th>
                  <th className="text-center px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">{item.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-mono font-bold ${isLowStock(item) ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-900 dark:text-white'}`}>
                        {Number(item.stock).toLocaleString('id-ID')}
                      </span>
                      <span className="text-neutral-400 ml-1 text-[11px]">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-neutral-500 dark:text-neutral-400 font-mono hidden sm:table-cell">
                      {Number(item.min_stock).toLocaleString('id-ID')} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400 font-mono hidden md:table-cell">
                      {displayMoney(item.price_per_unit)}/{item.unit}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isLowStock(item) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                          <AlertTriangle size={10} /> Rendah
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                          Aman
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button 
                          onClick={() => setDeleteId(item.id)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 w-full max-w-sm border border-neutral-200/80 dark:border-neutral-800 shadow-2xl space-y-4">
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Hapus Bahan Baku?</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">Data bahan baku yang dihapus tidak dapat dipulihkan.</p>
            </div>
            <div className="flex gap-2.5">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
