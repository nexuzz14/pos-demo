import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Users, UserPlus, Pencil, Trash2, X, Shield,
  ShoppingCart, ChevronDown, Search, CheckCircle, AlertCircle
} from 'lucide-react';

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    icon: <Shield size={12} />,
    color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60'
  },
  cashier: {
    label: 'Kasir',
    icon: <ShoppingCart size={12} />,
    color: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
  },
};

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const [addForm, setAddForm] = useState({
    email: '', password: '', full_name: '', role_id: '2'
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*, roles(id, name)').order('created_at', { ascending: false }),
        supabase.from('roles').select('*')
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      setUsers(profilesRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (err) {
      showToast('Gagal memuat data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: addForm.email,
        password: addForm.password,
        options: { data: { full_name: addForm.full_name } }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Gagal membuat akun');

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: addForm.email,
          full_name: addForm.full_name,
          role_id: parseInt(addForm.role_id)
        });

      if (profileError) throw profileError;

      if (currentSession) {
        await supabase.auth.setSession({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token,
        });
      }

      showToast(`User ${addForm.email} berhasil ditambahkan.`);
      setAddForm({ email: '', password: '', full_name: '', role_id: '2' });
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      showToast('Gagal tambah user: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role_id: parseInt(editUser.role_id),
          full_name: editUser.full_name
        })
        .eq('id', editUser.id);

      if (error) throw error;
      showToast('Data user berhasil diperbarui.');
      setEditUser(null);
      fetchData();
    } catch (err) {
      showToast('Gagal update: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deleteUser.id);

      if (error) throw error;
      showToast(`User ${deleteUser.email} berhasil dihapus.`);
      setDeleteUser(null);
      fetchData();
    } catch (err) {
      showToast('Gagal hapus: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getRoleName = (u) => u.roles?.name || 'cashier';

  return (
    <div className="space-y-6 antialiased">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold transition-all border ${
          toast.type === 'error'
            ? 'bg-rose-900/90 text-white border-rose-800'
            : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-800 dark:border-neutral-200'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Manajemen Pengguna</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Pengaturan akun, peran staf, dan hak akses sistem</p>
        </div>

        <button
          onClick={() => { setShowAddForm(true); setEditUser(null); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <UserPlus size={15} />
          <span>Tambah User</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Total Akun</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1 font-mono">{users.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
            <Users size={18} />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Administrator</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1 font-mono">
              {users.filter(u => u.roles?.name === 'admin').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Shield size={18} />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Kasir Toko</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1 font-mono">
              {users.filter(u => u.roles?.name === 'cashier').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
            <ShoppingCart size={18} />
          </div>
        </div>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Tambah Pengguna Baru</h3>
            <button 
              onClick={() => setShowAddForm(false)}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={addForm.full_name}
                  onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="cth: Siti Rahayu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Email</label>
                <input 
                  type="email" 
                  value={addForm.email} 
                  required
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="user@bakebliss.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Password</label>
                <input 
                  type="password" 
                  value={addForm.password} 
                  required 
                  minLength={6}
                  onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 6 karakter"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Peran / Role</label>
                <div className="relative">
                  <select 
                    value={addForm.role_id}
                    onChange={e => setAddForm(f => ({ ...f, role_id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white appearance-none pr-10 text-xs font-medium"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name === 'admin' ? 'Administrator' : 'Kasir'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {saving ? 'Menyimpan...' : 'Tambah Pengguna'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Role Form */}
      {editUser && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Edit Informasi Pengguna</h3>
            <button 
              onClick={() => setEditUser(null)}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleUpdateRole} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={editUser.full_name || ''}
                  onChange={e => setEditUser(u => ({ ...u, full_name: e.target.value }))}
                  placeholder="Nama lengkap"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Email (Tetap)</label>
                <input 
                  type="text" 
                  value={editUser.email || ''} 
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/50 text-neutral-400 cursor-not-allowed text-xs font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Pilih Peran Akun</label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map(r => (
                    <button 
                      key={r.id} 
                      type="button"
                      onClick={() => setEditUser(u => ({ ...u, role_id: r.id }))}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        editUser.role_id === r.id
                          ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                      }`}
                    >
                      {r.name === 'admin' ? <Shield size={14} /> : <ShoppingCart size={14} />}
                      <span>{r.name === 'admin' ? 'Administrator' : 'Kasir Toko'}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button 
                type="button" 
                onClick={() => setEditUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input 
          type="text" 
          value={search} 
          placeholder="Cari berdasarkan nama atau alamat email..."
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-xs font-medium shadow-xs"
        />
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-400 font-medium">Memuat data pengguna...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={36} className="mx-auto mb-2.5 text-neutral-300 dark:text-neutral-700" />
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{search ? 'Pengguna tidak ditemukan' : 'Belum ada pengguna'}</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {filtered.map(u => {
              const roleName = getRoleName(u);
              const roleConf = ROLE_CONFIG[roleName] || ROLE_CONFIG.cashier;
              const isMe = u.id === currentUser?.id;

              return (
                <div key={u.id} className="flex items-center gap-3.5 p-4 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {(u.full_name || u.email || '?')[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                        {u.full_name || '—'}
                      </span>
                      {isMe && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
                          Anda
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${roleConf.color}`}>
                        {roleConf.icon}
                        {roleConf.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{u.email}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditUser({ ...u, role_id: u.role_id })}
                      className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    {!isMe && (
                      <button
                        onClick={() => setDeleteUser(u)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 w-full max-w-sm border border-neutral-200/80 dark:border-neutral-800 shadow-2xl space-y-4">
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Hapus Pengguna?</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">
                Akun <span className="font-semibold text-neutral-800 dark:text-neutral-200">{deleteUser.email}</span> akan dinonaktifkan dari sistem.
              </p>
            </div>
            <div className="flex gap-2.5">
              <button 
                onClick={() => setDeleteUser(null)}
                className="flex-1 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteUser} 
                disabled={saving}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
