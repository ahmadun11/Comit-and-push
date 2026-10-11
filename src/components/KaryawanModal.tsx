import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Phone, 
  User, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle,
  Search,
  MessageSquare
} from 'lucide-react';
import { Karyawan } from '../types';
import { formatIndonesianPhoneNumber } from '../services/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  karyawanList: Karyawan[];
  onSaveKaryawan: (karyawan: { id?: number; nama: string; noHp?: string; jabatan?: string }) => void | Promise<void>;
  onDeleteKaryawan: (id: number) => void | Promise<void>;
}

export const KaryawanModal: React.FC<Props> = ({
  isOpen,
  onClose,
  karyawanList,
  onSaveKaryawan,
  onDeleteKaryawan
}) => {
  const [idEdit, setIdEdit] = useState<number | undefined>(undefined);
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [jabatan, setJabatan] = useState('Teknisi HP');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [karyawanToDelete, setKaryawanToDelete] = useState<Karyawan | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNama = nama.trim();
    if (!cleanNama) {
      setFeedback({ type: 'error', message: 'Nama karyawan / teknisi wajib diisi!' });
      return;
    }

    try {
      await onSaveKaryawan({
        id: idEdit,
        nama: cleanNama,
        noHp: noHp.trim(),
        jabatan: jabatan.trim() || 'Teknisi HP'
      });

      setFeedback({
        type: 'success',
        message: idEdit 
          ? `Perubahan data "${cleanNama}" berhasil disimpan!` 
          : `Karyawan "${cleanNama}" berhasil ditambahkan!`
      });

      // Reset form
      setIdEdit(undefined);
      setNama('');
      setNoHp('');
      setJabatan('Teknisi HP');

      setTimeout(() => {
        setFeedback(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving karyawan:', err);
      setFeedback({ type: 'error', message: err?.message || 'Gagal menyimpan data karyawan.' });
    }
  };

  const handleStartEdit = (k: Karyawan) => {
    setIdEdit(k.id);
    setNama(k.nama);
    setNoHp(k.noHp || '');
    setJabatan(k.jabatan || 'Teknisi HP');
    setFeedback(null);
  };

  const handleCancelEdit = () => {
    setIdEdit(undefined);
    setNama('');
    setNoHp('');
    setJabatan('Teknisi HP');
    setFeedback(null);
  };

  const confirmDelete = async () => {
    if (!karyawanToDelete) return;
    try {
      const idToDelete = karyawanToDelete.id;
      if (idToDelete !== undefined) {
        await onDeleteKaryawan(idToDelete);
      }
      if (idEdit === idToDelete) {
        handleCancelEdit();
      }
      setFeedback({ type: 'success', message: `Data "${karyawanToDelete.nama}" telah berhasil dihapus.` });
      setKaryawanToDelete(null);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Gagal menghapus karyawan.' });
      setKaryawanToDelete(null);
    }
  };

  const filteredList = karyawanList.filter(k => 
    k.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (k.noHp && k.noHp.includes(searchQuery)) ||
    (k.jabatan && k.jabatan.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 font-bold text-base text-cyan-400">
            <div className="p-2 rounded-xl bg-cyan-950/70 border border-cyan-500/30 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white leading-tight">Kelola Data Karyawan & Teknisi</div>
              <div className="text-[11px] text-slate-400 font-normal">Pencatatan teknisi, kasir, dan integrasi slip gaji otomatis</div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-xs animate-in fade-in ${
            feedback.type === 'success' 
              ? 'bg-emerald-950/50 border border-emerald-500/50 text-emerald-300' 
              : 'bg-rose-950/50 border border-rose-500/50 text-rose-300'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Inline Delete Confirmation */}
        {karyawanToDelete && (
          <div className="mb-4 p-3.5 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs space-y-2.5 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-300 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Konfirmasi Hapus Data Karyawan</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Yakin ingin menghapus <strong className="text-white">{karyawanToDelete.nama}</strong> ({karyawanToDelete.jabatan || 'Teknisi HP'}) dari sistem?
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition text-xs shadow flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Sekarang</span>
              </button>
              <button
                type="button"
                onClick={() => setKaryawanToDelete(null)}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>{idEdit ? '✏️ Edit Data Karyawan / Teknisi' : '➕ Tambah Karyawan / Teknisi Baru'}</span>
            {idEdit && (
              <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                Mode Edit Aktif
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Nama Input */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Nama Lengkap Karyawan / Teknisi <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Andi Pratama"
                  required
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Jabatan Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Posisi / Jabatan
              </label>
              <div className="relative">
                <Briefcase className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <select
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Teknisi HP">Teknisi HP</option>
                  <option value="Teknisi Software">Teknisi Software</option>
                  <option value="Kasir & Admin">Kasir & Admin</option>
                  <option value="Bagian Sparepart">Bagian Sparepart</option>
                  <option value="Karyawan">Karyawan</option>
                  <option value="Magang / Freelance">Magang / Freelance</option>
                </select>
              </div>
            </div>

            {/* No HP (Optional) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>No. WhatsApp / HP</span>
                <span className="text-[10px] text-slate-500 font-normal">(Opsional)</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="08123456789"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{idEdit ? 'Simpan Perubahan' : 'Simpan Karyawan'}</span>
            </button>
            {idEdit && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
            )}
          </div>
        </form>

        {/* Employee List Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>Daftar Karyawan Terdaftar</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-cyan-300 border border-slate-700">
                {karyawanList.length} Orang
              </span>
            </div>

            {/* Quick Search Filter */}
            {karyawanList.length > 3 && (
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama karyawan..."
                  className="bg-slate-950 border border-slate-700 rounded-lg py-1.5 pl-7 pr-2.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-44"
                />
              </div>
            )}
          </div>

          {karyawanList.length === 0 ? (
            <div className="text-center py-7 px-4 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-60" />
              <div>Belum ada data karyawan tersimpan.</div>
              <div className="text-[11px] text-slate-600 mt-0.5">Ketik nama di formulir atas lalu klik "Simpan Karyawan".</div>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-5 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
              Tidak ditemukan karyawan dengan kata kunci "{searchQuery}".
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {filteredList.map((k) => {
                const hasWa = Boolean(k.noHp && k.noHp.trim().length >= 9);
                return (
                  <div
                    key={k.id || k.nama}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs transition ${
                      idEdit === k.id 
                        ? 'bg-amber-950/30 border-amber-500/50' 
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm">{k.nama}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                          {k.jabatan || 'Teknisi HP'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{k.noHp || 'Tanpa No. HP'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasWa && (
                        <a
                          href={`https://wa.me/${formatIndonesianPhoneNumber(k.noHp || '').waClean}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition"
                          title="Chat via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleStartEdit(k)}
                        className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition"
                        title="Edit data ini"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setKaryawanToDelete(k)}
                        className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-950/60 rounded-lg transition"
                        title="Hapus Karyawan Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
