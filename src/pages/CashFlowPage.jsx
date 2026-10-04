import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { exportToExcel } from '../utils/exportExcel';
import {
  PlusCircle, ArrowDownLeft, ArrowUpRight, Wallet,
  Download, X, Pencil, Trash2, ChevronDown, Eye, EyeOff
} from 'lucide-react';

const CATEGORIES_IN = ['Penjualan', 'Modal', 'Investasi', 'Lain-lain'];
const CATEGORIES_OUT = ['Pembelian Bahan', 'Gaji', 'Listrik & Air', 'Sewa', 'Transportasi', 'Peralatan', 'Lain-lain'];

const initialForm = {
  type: 'in',
  category: '',
  description: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
};

export function CashFlowPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [deleteId, setDeleteId] = useState(null);
  const [showMoney, setShowMoney] = useState(false);

  const displayMoney = useCallback((val) => showMoney ? formatCurrency(val) : 'Rp •••••••', [showMoney]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cash_flow')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filterMonth) {
        const start = `${filterMonth}-01`;
        const end = new Date(filterMonth.slice(0, 4), filterMonth.slice(5, 7), 0)
          .toISOString().split('T')[0];
        query = query.gte('date', start).lte('date', end);
      }
      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching cash flow:', err);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterMonth]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const totalIn = records.filter(r => r.type === 'in').reduce((s, r) => s + Number(r.amount), 0);
  const totalOut = records.filter(r => r.type === 'out').reduce((s, r) => s + Number(r.amount), 0);
  const balance = totalIn - totalOut;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
        date: form.date,
        user_id: user?.id,
      };

      if (editId) {
        const { error } = await supabase.from('cash_flow').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cash_flow').insert(payload);
        if (error) throw error;
      }

      setForm(initialForm);
      setEditId(null);
      setShowForm(false);
      fetchRecords();
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record) => {
    setForm({
      type: record.type,
      category: record.category || '',
      description: record.description || '',
      amount: String(record.amount),
      date: record.date,
    });
    setEditId(record.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('cash_flow').delete().eq('id', deleteId);
      if (error) throw error;
      setDeleteId(null);
      fetchRecords();
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const handleExport = () => {
    const exportData = records.map(r => ({
      'Tanggal': r.date,
      'Tipe': r.type === 'in' ? 'Masuk' : 'Keluar',
      'Kategori': r.category || '-',
      'Deskripsi': r.description || '-',
      'Jumlah (Rp)': Number(r.amount),
    }));
    exportToExcel(exportData, `Kas-BakeBliss-${filterMonth}`, 'Kas');
  };

  const categories = form.type === 'in' ? CATEGORIES_IN : CATEGORIES_OUT;

  return (
    <div className="space-y-6 antialiased">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Arus Kas</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Pencatatan kas masuk dan keluar operasional</p>
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
            <span>Tambah Catatan</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Kas Masuk</p>
            <p className="text-base font-bold text-neutral-900 dark:text-white mt-1 font-mono">{displayMoney(totalIn)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ArrowDownLeft size={18} />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Kas Keluar</p>
            <p className="text-base font-bold text-neutral-900 dark:text-white mt-1 font-mono">{displayMoney(totalOut)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ArrowUpRight size={18} />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Saldo Bersih</p>
            <p className="text-base font-bold text-neutral-900 dark:text-white mt-1 font-mono">{displayMoney(balance)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
            <Wallet size={18} />
          </div>
        </div>
      </div>

      {/* Form Add/Edit */}
      {showForm && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">{editId ? 'Edit Catatan Kas' : 'Tambah Catatan Kas Baru'}</h3>
            <button 
              onClick={() => { setShowForm(false); setEditId(null); setForm(initialForm); }}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipe Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => setForm(f => ({ ...f, type: 'in', category: '' }))}
                className={`py-2.5 rounded-xl font-semibold text-xs border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  form.type === 'in'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <ArrowDownLeft size={15} />
                <span>Uang Masuk</span>
              </button>

              <button 
                type="button"
                onClick={() => setForm(f => ({ ...f, type: 'out', category: '' }))}
                className={`py-2.5 rounded-xl font-semibold text-xs border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  form.type === 'out'
                    ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <ArrowUpRight size={15} />
                <span>Uang Keluar</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Kategori */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Kategori</label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white appearance-none pr-10 text-xs font-medium"
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                </div>
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Tanggal</label>
                <input 
                  type="date" 
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-xs font-medium"
                />
              </div>
            </div>

            {/* Jumlah */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Jumlah Nominal (Rp)</label>
              <input 
                type="number" 
                value={form.amount} 
                placeholder="0"
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required 
                min="1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-xs font-medium"
              />
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Deskripsi / Catatan (Opsional)</label>
              <textarea 
                value={form.description} 
                rows={2}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Keterangan transaksi..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white resize-none text-xs font-medium"
              />
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
                {saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Tambah Catatan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'in', label: 'Kas Masuk' },
            { id: 'out', label: 'Kas Keluar' }
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => setFilterType(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterType === t.id
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input 
          type="month" 
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white font-medium shadow-xs"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-400 font-medium">Memuat catatan kas...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet size={36} className="mx-auto mb-2.5 text-neutral-300 dark:text-neutral-700" />
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Belum ada catatan arus kas di periode ini</p>
            <button 
              onClick={() => setShowForm(true)}
              className="mt-3 px-3.5 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-xs font-medium cursor-pointer"
            >
              Tambah Catatan
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-neutral-50/80 dark:bg-neutral-800/40 border-b border-neutral-200/80 dark:border-neutral-800">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Tanggal</th>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Tipe</th>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Kategori</th>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">Deskripsi</th>
                  <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Nominal</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 font-mono whitespace-nowrap">
                      {new Date(r.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        r.type === 'in'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60'
                      }`}>
                        {r.type === 'in' ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                        {r.type === 'in' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200 font-medium">{r.category || '-'}</td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 hidden sm:table-cell max-w-[200px] truncate">
                      {r.description || '-'}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold font-mono whitespace-nowrap ${
                      r.type === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-900 dark:text-white'
                    }`}>
                      {r.type === 'in' ? '+' : '-'}{displayMoney(r.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button 
                          onClick={() => handleEdit(r)}
                          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button 
                          onClick={() => setDeleteId(r.id)}
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

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 w-full max-w-sm border border-neutral-200/80 dark:border-neutral-800 shadow-2xl space-y-4">
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Hapus Catatan Kas?</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">Data catatan kas yang dihapus tidak dapat dipulihkan.</p>
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
