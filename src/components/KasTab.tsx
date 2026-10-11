import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  CreditCard,
  X 
} from 'lucide-react';
import { TransaksiKas, ServisItem, JenisKas } from '../types';
import { formatRupiah, getTodayISO, convertISOToDMY } from '../services/db';

interface Props {
  kasList: TransaksiKas[];
  servisList: ServisItem[];
  isModeEditUnlocked: boolean;
  onAddKas: (kas: Omit<TransaksiKas, 'id'>) => void;
  onUpdateKas: (kas: TransaksiKas) => void;
  onDeleteKas: (id: number) => void;
}

export const KasTab: React.FC<Props> = ({
  kasList,
  servisList,
  isModeEditUnlocked,
  onAddKas,
  onUpdateKas,
  onDeleteKas
}) => {
  // Pemasukan state
  const [masukKategori, setMasukKategori] = useState('Pembayaran Servis');
  const [masukTgl, setMasukTgl] = useState(getTodayISO());
  const [masukNominal, setMasukNominal] = useState('');
  const [masukMetode, setMasukMetode] = useState<'Cash' | 'Transfer' | 'QRIS'>('Cash');
  const [masukModeKet, setMasukModeKet] = useState<'manual' | 'auto'>('manual');
  const [masukNotaRef, setMasukNotaRef] = useState('');
  const [masukKet, setMasukKet] = useState('');

  // Pengeluaran state
  const [keluarKategori, setKeluarKategori] = useState('Beli Sparepart/Alat');
  const [keluarTgl, setKeluarTgl] = useState(getTodayISO());
  const [keluarNominal, setKeluarNominal] = useState('');
  const [keluarMetode, setKeluarMetode] = useState<'Cash' | 'Transfer' | 'QRIS'>('Cash');
  const [keluarKet, setKeluarKet] = useState('');

  // Edit modal
  const [editingKas, setEditingKas] = useState<TransaksiKas | null>(null);

  const handlePemasukanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nom = parseFloat(masukNominal) || 0;
    if (nom <= 0) return;

    let keteranganFinal = masukKet.trim();
    if (masukModeKet === 'auto') {
      keteranganFinal = masukNotaRef || 'Pelunasan Servis';
    }

    onAddKas({
      tanggal: convertISOToDMY(masukTgl),
      jenis: 'pemasukan',
      kategori: masukKategori,
      nominal: nom,
      metode: masukMetode,
      keterangan: keteranganFinal || '-'
    });

    setMasukNominal('');
    setMasukKet('');
  };

  const handlePengeluaranSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nom = parseFloat(keluarNominal) || 0;
    if (nom <= 0) return;

    onAddKas({
      tanggal: convertISOToDMY(keluarTgl),
      jenis: 'pengeluaran',
      kategori: keluarKategori,
      nominal: nom,
      metode: keluarMetode,
      keterangan: keluarKet.trim() || '-'
    });

    setKeluarNominal('');
    setKeluarKet('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKas) return;
    onUpdateKas(editingKas);
    setEditingKas(null);
  };

  // Filter out archived salary kasbon items from general kas list
  const activeKasList = kasList.filter(
    k => !(k.kategori === 'Kasbon Karyawan' && k.keterangan && k.keterangan.includes('[LUNAS_GAJI]'))
  );

  return (
    <div className="space-y-4">
      
      {/* Title Card */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <span>Pencatatan Kas Toko (Buku Kas Real)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Catat arus uang masuk dan keluar setiap hari dengan rapi dan transparan.
          </p>
        </div>
      </div>

      {/* Dual Forms: Pemasukan & Pengeluaran */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Pemasukan Form */}
        <form onSubmit={handlePemasukanSubmit} className="bg-slate-900/95 border border-emerald-500/40 p-4 sm:p-5 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm border-b border-emerald-500/20 pb-2.5">
            <ArrowDownLeft className="w-4 h-4" />
            <span>📥 Input Kas Pemasukan (Uang Masuk)</span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Kategori Pemasukan
            </label>
            <select
              value={masukKategori}
              onChange={(e) => setMasukKategori(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Pembayaran Servis">Pembayaran Servis</option>
              <option value="DP Servis">DP Servis</option>
              <option value="Penjualan Sparepart">Penjualan Sparepart</option>
              <option value="Penjualan Aksesori">Penjualan Aksesori</option>
              <option value="Pemasukan Lainnya">Pemasukan Lainnya</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Tanggal Transaksi
              </label>
              <input
                type="date"
                value={masukTgl}
                onChange={(e) => setMasukTgl(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Metode Bayar
              </label>
              <select
                value={masukMetode}
                onChange={(e) => setMasukMetode(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Cash">Cash (Tunai)</option>
                <option value="Transfer">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Nominal Pemasukan (Rp) *
            </label>
            <input
              type="number"
              value={masukNominal}
              onChange={(e) => setMasukNominal(e.target.value)}
              placeholder="Contoh: 150000"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-400">
                Mode Keterangan
              </label>
              <div className="flex gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => setMasukModeKet('manual')}
                  className={`font-semibold ${masukModeKet === 'manual' ? 'text-emerald-400 underline' : 'text-slate-500'}`}
                >
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setMasukModeKet('auto')}
                  className={`font-semibold ${masukModeKet === 'auto' ? 'text-emerald-400 underline' : 'text-slate-500'}`}
                >
                  Pilih Nota Servis
                </button>
              </div>
            </div>

            {masukModeKet === 'auto' ? (
              <select
                value={masukNotaRef}
                onChange={(e) => setMasukNotaRef(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Pilih Nota Unit Servis --</option>
                {servisList.map(s => (
                  <option key={s.id} value={`[${s.noNota}] ${s.namaPelanggan} - ${s.tipeHp}`}>
                    {s.noNota} - {s.namaPelanggan} ({s.tipeHp}) [{s.status}]
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={masukKet}
                onChange={(e) => setMasukKet(e.target.value)}
                placeholder="Contoh: Pembayaran ganti baterai Budi"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
          >
            ＋ Simpan Pemasukan
          </button>
        </form>

        {/* Pengeluaran Form */}
        <form onSubmit={handlePengeluaranSubmit} className="bg-slate-900/95 border border-rose-500/40 p-4 sm:p-5 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm border-b border-rose-500/20 pb-2.5">
            <ArrowUpRight className="w-4 h-4" />
            <span>📤 Input Kas Pengeluaran (Uang Keluar)</span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Kategori Pengeluaran
            </label>
            <select
              value={keluarKategori}
              onChange={(e) => setKeluarKategori(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="Beli Sparepart/Alat">Beli Sparepart / Alat Servis</option>
              <option value="Sewa Tempat/Listrik">Sewa Tempat / Listrik / WiFi</option>
              <option value="Kasbon Karyawan">Kasbon Karyawan</option>
              <option value="Operasional Toko">Operasional Toko / Bensin</option>
              <option value="Pengeluaran Lainnya">Pengeluaran Lainnya</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Tanggal Transaksi
              </label>
              <input
                type="date"
                value={keluarTgl}
                onChange={(e) => setKeluarTgl(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Metode Bayar
              </label>
              <select
                value={keluarMetode}
                onChange={(e) => setKeluarMetode(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Cash">Cash (Tunai)</option>
                <option value="Transfer">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Nominal Pengeluaran (Rp) *
            </label>
            <input
              type="number"
              value={keluarNominal}
              onChange={(e) => setKeluarNominal(e.target.value)}
              placeholder="Contoh: 50000"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-bold focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Catatan / Keterangan Pengeluaran *
            </label>
            <input
              type="text"
              value={keluarKet}
              onChange={(e) => setKeluarKet(e.target.value)}
              placeholder="Contoh: Beli timah solder, obeng & flux"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition"
          >
            ＋ Simpan Pengeluaran
          </button>
        </form>

      </div>

      {/* Kas History Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-white">
            Riwayat Transaksi Kas Periode Berjalan ({activeKasList.length})
          </h3>
        </div>

        {activeKasList.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            Belum ada catatan kas di periode ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                <tr>
                  <th className="py-3 px-4">Tanggal / Kategori</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4">Pemasukan (Rp)</th>
                  <th className="py-3 px-4">Pengeluaran (Rp)</th>
                  <th className="py-3 px-4">Metode</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeKasList.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-400 text-[11px]">{k.tanggal}</div>
                      <div className="font-bold text-white mt-0.5">{k.kategori}</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                      {k.keterangan || '-'}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-bold text-emerald-400">
                      {k.jenis === 'pemasukan' ? formatRupiah(k.nominal) : '-'}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-bold text-rose-400">
                      {k.jenis === 'pengeluaran' ? formatRupiah(k.nominal) : '-'}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {k.metode}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingKas(k)}
                          className="p-1.5 text-amber-400 hover:text-white hover:bg-amber-950/60 rounded-lg transition"
                          title="Edit Transaksi Kas"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => k.id && onDeleteKas(k.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded-lg transition"
                          title="Hapus Transaksi Kas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Edit Kas Modal */}
      {editingKas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-cyan-400">
                ✏️ Edit Transaksi Kas
              </h3>
              <button 
                onClick={() => setEditingKas(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Tanggal Transaksi (DD/MM/YYYY)
                </label>
                <input
                  type="text"
                  value={editingKas.tanggal}
                  onChange={(e) => setEditingKas({ ...editingKas, tanggal: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Jenis
                  </label>
                  <select
                    value={editingKas.jenis}
                    onChange={(e) => setEditingKas({ ...editingKas, jenis: e.target.value as JenisKas })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="pemasukan">📥 Pemasukan</option>
                    <option value="pengeluaran">📤 Pengeluaran</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Metode Bayar
                  </label>
                  <select
                    value={editingKas.metode}
                    onChange={(e) => setEditingKas({ ...editingKas, metode: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Transfer">Transfer</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Kategori
                </label>
                <input
                  type="text"
                  value={editingKas.kategori}
                  onChange={(e) => setEditingKas({ ...editingKas, kategori: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  value={editingKas.nominal}
                  onChange={(e) => setEditingKas({ ...editingKas, nominal: Number(e.target.value) })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Keterangan / Catatan
                </label>
                <input
                  type="text"
                  value={editingKas.keterangan}
                  onChange={(e) => setEditingKas({ ...editingKas, keterangan: e.target.value })}
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
                  onClick={() => setEditingKas(null)}
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
