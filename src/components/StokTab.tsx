import React, { useState } from 'react';
import { Package, Plus, Trash2, AlertTriangle, TrendingUp, Search, X, Edit2 } from 'lucide-react';
import { Sparepart } from '../types';
import { formatRupiah } from '../services/db';

interface Props {
  sparepartList: Sparepart[];
  isModeEditUnlocked: boolean;
  onAddSparepart: (sp: Omit<Sparepart, 'id'>) => void;
  onUpdateSparepart: (sp: Sparepart) => void;
  onDeleteSparepart: (id: number) => void;
}

export const StokTab: React.FC<Props> = ({
  sparepartList,
  isModeEditUnlocked,
  onAddSparepart,
  onUpdateSparepart,
  onDeleteSparepart
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [nama, setNama] = useState('');
  const [stok, setStok] = useState('');
  const [modal, setModal] = useState('');
  const [jual, setJual] = useState('');

  const [editingItem, setEditingItem] = useState<Sparepart | null>(null);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const jmlStok = parseInt(stok) || 0;
    const hrgModal = parseFloat(modal) || 0;
    const hrgJual = parseFloat(jual) || 0;
    if (!nama.trim() || jmlStok < 0) return;

    onAddSparepart({
      nama: nama.trim(),
      stok: jmlStok,
      hargaModal: hrgModal,
      hargaJual: hrgJual
    });

    setNama('');
    setStok('');
    setModal('');
    setJual('');
    setFormOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    onUpdateSparepart(editingItem);
    setEditingItem(null);
  };

  const filteredList = sparepartList.filter(s =>
    s.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItemCount = sparepartList.reduce((acc, curr) => acc + curr.stok, 0);
  const totalNilaiModal = sparepartList.reduce((acc, curr) => acc + (curr.hargaModal * curr.stok), 0);
  const lowStockCount = sparepartList.filter(s => s.stok <= 2).length;

  return (
    <div className="space-y-4">
      
      {/* Header bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            <span>Manajemen Stok Sparepart HP</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola ketersediaan LCD, Baterai, Konektor, dan komponen servis lainnya.
          </p>
        </div>

        <button
          onClick={() => setFormOpen(!formOpen)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-900/40 transition"
        >
          {formOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{formOpen ? 'Tutup Form' : 'Tambah Sparepart'}</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Unit</span>
          <div className="text-lg font-extrabold text-white mt-0.5">{totalItemCount} pcs</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Nilai Aset Modal</span>
          <div className="text-lg font-extrabold text-cyan-400 mt-0.5">{formatRupiah(totalNilaiModal)}</div>
        </div>

        <div className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">Stok Menipis (≤2)</span>
          <div className="text-lg font-extrabold text-rose-400 mt-0.5">{lowStockCount} item</div>
        </div>
      </div>

      {/* Add Form */}
      {formOpen && (
        <form onSubmit={handleAddSubmit} className="bg-slate-900/95 border border-cyan-500/30 p-4 sm:p-5 rounded-2xl shadow-xl space-y-3 animate-in fade-in duration-150">
          <div className="text-xs font-bold text-cyan-300 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Form Tambah Sparepart Baru</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Nama Sparepart / Model HP *
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: LCD iPhone 11 Original"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Jumlah Stok (Pcs) *
              </label>
              <input
                type="number"
                value={stok}
                onChange={(e) => setStok(e.target.value)}
                placeholder="Contoh: 5"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Harga Modal Toko (Rp) *
              </label>
              <input
                type="number"
                value={modal}
                onChange={(e) => setModal(e.target.value)}
                placeholder="Contoh: 650000"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Harga Jual ke Pelanggan (Rp) *
              </label>
              <input
                type="number"
                value={jual}
                onChange={(e) => setJual(e.target.value)}
                placeholder="Contoh: 850000"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
            >
              ＋ Simpan Sparepart
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold rounded-xl"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Cari nama sparepart..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            Belum ada sparepart yang terdaftar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                <tr>
                  <th className="py-3 px-4">Nama Item</th>
                  <th className="py-3 px-4 text-center">Stok</th>
                  <th className="py-3 px-4">Harga Modal</th>
                  <th className="py-3 px-4">Harga Jual</th>
                  <th className="py-3 px-4">Margin Untung</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map((sp) => {
                  const isLow = sp.stok <= 2;
                  const margin = sp.hargaJual - sp.hargaModal;
                  return (
                    <tr key={sp.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-white">
                        {sp.nama}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          isLow 
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {isLow && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                          {sp.stok} pcs
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        {formatRupiah(sp.hargaModal)}
                      </td>

                      <td className="py-3 px-4 font-bold text-cyan-300">
                        {formatRupiah(sp.hargaJual)}
                      </td>

                      <td className="py-3 px-4 font-semibold text-emerald-400">
                        +{formatRupiah(margin)}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingItem(sp)}
                            className="p-1.5 text-amber-400 hover:text-white hover:bg-amber-950/60 rounded-lg transition"
                            title="Edit Sparepart"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => sp.id && onDeleteSparepart(sp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded-lg transition"
                            title="Hapus Sparepart"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Sparepart Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-cyan-400">
                ✏️ Edit Stok & Harga Sparepart
              </h3>
              <button 
                onClick={() => setEditingItem(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nama Sparepart
                </label>
                <input
                  type="text"
                  value={editingItem.nama}
                  onChange={(e) => setEditingItem({ ...editingItem, nama: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Jumlah Stok (Pcs)
                </label>
                <input
                  type="number"
                  value={editingItem.stok}
                  onChange={(e) => setEditingItem({ ...editingItem, stok: Number(e.target.value) })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Harga Modal (Rp)
                </label>
                <input
                  type="number"
                  value={editingItem.hargaModal}
                  onChange={(e) => setEditingItem({ ...editingItem, hargaModal: Number(e.target.value) })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Harga Jual (Rp)
                </label>
                <input
                  type="number"
                  value={editingItem.hargaJual}
                  onChange={(e) => setEditingItem({ ...editingItem, hargaJual: Number(e.target.value) })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
