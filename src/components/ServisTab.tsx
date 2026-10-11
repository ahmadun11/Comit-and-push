import React, { useState } from 'react';
import { 
  Wrench, 
  Search, 
  Plus, 
  Printer, 
  MessageCircle, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Package, 
  X,
  Phone,
  User,
  Smartphone,
  Hash
} from 'lucide-react';
import { ServisItem, Sparepart, StatusServis } from '../types';
import { formatRupiah, formatDateToDMY } from '../services/db';

interface Props {
  servisList: ServisItem[];
  sparepartList: Sparepart[];
  isModeEditUnlocked: boolean;
  onAddServis: (data: Omit<ServisItem, 'id'>, idSparepartUsed?: number | null) => void;
  onUpdateStatus: (id: number, statusBaru: StatusServis) => void;
  onUpdateServis: (data: ServisItem) => void;
  onDeleteServis: (id: number) => void;
  onViewNota: (servis: ServisItem) => void;
  onShareWhatsApp: (servis: ServisItem) => void;
}

export const ServisTab: React.FC<Props> = ({
  servisList,
  sparepartList,
  isModeEditUnlocked,
  onAddServis,
  onUpdateStatus,
  onUpdateServis,
  onDeleteServis,
  onViewNota,
  onShareWhatsApp
}) => {
  // New service form state
  const [formOpen, setFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | StatusServis>('All');

  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [noHp, setNoHp] = useState('');
  const [tipeHp, setTipeHp] = useState('');
  const [imei, setImei] = useState('');
  const [keluhan, setKeluhan] = useState('');
  const [selectedSpId, setSelectedSpId] = useState<string>('');
  const [hargaSp, setHargaSp] = useState<number>(0);
  const [jasaServis, setJasaServis] = useState<number>(0);
  const [dp, setDp] = useState<number>(0);

  // Edit modal state
  const [editingItem, setEditingItem] = useState<ServisItem | null>(null);

  // Handle sparepart change in new form
  const handleSparepartChange = (spIdStr: string) => {
    setSelectedSpId(spIdStr);
    if (!spIdStr) {
      setHargaSp(0);
      return;
    }
    const found = sparepartList.find(s => String(s.id) === spIdStr);
    if (found) {
      setHargaSp(found.hargaJual);
    }
  };

  const totalBiaya = hargaSp + jasaServis;

  const handleCreateServis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPelanggan.trim() || !tipeHp.trim()) return;

    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    const randomNum = Math.floor(100 + Math.random() * 900);
    const noNota = `SRV-${d}${m}${y}-${randomNum}`;

    let idSp: number | null = null;
    let namaSp = '';
    let modalSp = 0;

    if (selectedSpId) {
      const found = sparepartList.find(s => String(s.id) === selectedSpId);
      if (found) {
        idSp = found.id || null;
        namaSp = found.nama;
        modalSp = found.hargaModal;
      }
    } else if (hargaSp > 0) {
      namaSp = 'Sparepart HP';
    }

    const newServis: Omit<ServisItem, 'id'> = {
      noNota,
      tanggal: formatDateToDMY(now),
      tanggalDiambil: '-',
      namaPelanggan: namaPelanggan.trim(),
      noHp: noHp.trim() || '-',
      tipeHp: tipeHp.trim(),
      imei: imei.trim(),
      keluhan: keluhan.trim(),
      idSparepart: idSp,
      namaSparepart: namaSp,
      modalSparepart: modalSp,
      hargaSparepart: hargaSp,
      jasaServis,
      totalBiaya,
      dp,
      status: 'Dikerjakan'
    };

    onAddServis(newServis, idSp);

    // Reset form
    setNamaPelanggan('');
    setNoHp('');
    setTipeHp('');
    setImei('');
    setKeluhan('');
    setSelectedSpId('');
    setHargaSp(0);
    setJasaServis(0);
    setDp(0);
    setFormOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    onUpdateServis(editingItem);
    setEditingItem(null);
  };

  // Filter list
  const filteredList = servisList.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      item.namaPelanggan.toLowerCase().includes(q) ||
      item.noNota.toLowerCase().includes(q) ||
      item.tipeHp.toLowerCase().includes(q) ||
      (item.noHp && item.noHp.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            <span>Manajemen Servis HP & Nota</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Input unit masuk, pelacakan proses pengerjaan, dan pencetakan nota pelanggan.
          </p>
        </div>

        <button
          onClick={() => setFormOpen(!formOpen)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-900/40 transition"
        >
          {formOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{formOpen ? 'Tutup Form' : 'Input Servis Baru'}</span>
        </button>
      </div>

      {/* New Service Form Drawer */}
      {formOpen && (
        <form onSubmit={handleCreateServis} className="bg-slate-900/95 border border-cyan-500/30 p-5 rounded-2xl shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Form Pendaftaran Unit Servis Baru</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">No. Nota Otomatis dibuat saat simpan</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Nama Pelanggan *
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={namaPelanggan}
                  onChange={(e) => setNamaPelanggan(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                No. WhatsApp / HP (Opsional)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Merek & Tipe HP *
              </label>
              <div className="relative">
                <Smartphone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={tipeHp}
                  onChange={(e) => setTipeHp(e.target.value)}
                  placeholder="Contoh: iPhone 11 / Samsung A52"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                IMEI / Nomor Seri (Opsional)
              </label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  placeholder="Contoh: 356789123456789"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Keluhan / Kerusakan *
            </label>
            <textarea
              value={keluhan}
              onChange={(e) => setKeluhan(e.target.value)}
              rows={2}
              placeholder="Contoh: Layar blank hitam, getar masih ada, ganti LCD"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Pilih Sparepart dari Stok
              </label>
              <select
                value={selectedSpId}
                onChange={(e) => handleSparepartChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Jasa Saja / Manual --</option>
                {sparepartList.filter(s => s.stok > 0).map(sp => (
                  <option key={sp.id} value={sp.id}>
                    {sp.nama} (Stok: {sp.stok} - {formatRupiah(sp.hargaJual)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Harga Sparepart (Rp)
              </label>
              <input
                type="number"
                value={hargaSp}
                onChange={(e) => setHargaSp(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Biaya Jasa Servis (Rp) *
              </label>
              <input
                type="number"
                value={jasaServis}
                onChange={(e) => setJasaServis(Number(e.target.value))}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Uang Muka / DP (Rp)
              </label>
              <input
                type="number"
                value={dp}
                onChange={(e) => setDp(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-300">
              Total Estimasi: <strong className="text-base text-cyan-300 ml-1">{formatRupiah(totalBiaya)}</strong>
              <span className="text-slate-500 ml-2">
                (Sisa: {formatRupiah(totalBiaya - dp)})
              </span>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                ＋ Simpan & Terbitkan Nota
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 font-semibold text-xs rounded-xl"
              >
                Batal
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Cari nama pelanggan, nota, no HP, atau tipe HP..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['All', 'Dikerjakan', 'Selesai', 'Diambil', 'Cancel'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === st 
                  ? 'bg-cyan-600 text-white shadow' 
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'All' ? 'Semua' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Services List Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500">
            Tidak ada data servis yang sesuai dengan pencarian atau filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                <tr>
                  <th className="py-3 px-4">Nota / Tanggal</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Unit & Keluhan</th>
                  <th className="py-3 px-4">Total Biaya</th>
                  <th className="py-3 px-4">Status Pengerjaan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map((item) => {
                  const sisa = item.totalBiaya - item.dp;
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-cyan-300">{item.noNota}</div>
                        <div className="text-[11px] text-slate-500">{item.tanggal}</div>
                        {item.status === 'Diambil' && item.tanggalDiambil && (
                          <div className="text-[10px] text-emerald-400 font-medium">
                            Ambil: {item.tanggalDiambil}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{item.namaPelanggan}</div>
                        <div className="text-[11px] text-slate-400">{item.noHp || '-'}</div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-200">{item.tipeHp}</div>
                        <div className="text-[11px] text-slate-400 truncate" title={item.keluhan}>
                          {item.keluhan}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-white">{formatRupiah(item.totalBiaya)}</div>
                        <div className="text-[10px] text-slate-400">
                          DP: {formatRupiah(item.dp)} | Sisa: <span className="font-bold text-amber-400">{formatRupiah(sisa)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={item.status}
                          onChange={(e) => item.id && onUpdateStatus(item.id, e.target.value as StatusServis)}
                          className={`text-xs font-bold py-1.5 px-2.5 rounded-lg border focus:outline-none transition ${
                            item.status === 'Dikerjakan' 
                              ? 'bg-blue-950/80 border-blue-500/50 text-blue-300' 
                              : item.status === 'Selesai' 
                              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' 
                              : item.status === 'Diambil' 
                              ? 'bg-slate-800 border-slate-600 text-slate-300' 
                              : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                          }`}
                        >
                          <option value="Dikerjakan">Dikerjakan</option>
                          <option value="Selesai">Selesai</option>
                          <option value="Diambil">Diambil</option>
                          <option value="Cancel">Cancel (Batal)</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewNota(item)}
                            className="p-1.5 text-cyan-400 hover:text-white hover:bg-cyan-950/60 rounded-lg transition"
                            title="Lihat / Cetak Nota"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onShareWhatsApp(item)}
                            className="p-1.5 text-emerald-400 hover:text-white hover:bg-emerald-950/60 rounded-lg transition"
                            title="Kirim Nota via WA"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1.5 text-amber-400 hover:text-white hover:bg-amber-950/60 rounded-lg transition"
                            title="Edit Data Servis"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => item.id && onDeleteServis(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded-lg transition"
                            title="Hapus Servis"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Edit Servis Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-5 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-cyan-400">
                ✏️ Edit Data Servis HP ({editingItem.noNota})
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
                  Nama Pelanggan
                </label>
                <input
                  type="text"
                  value={editingItem.namaPelanggan}
                  onChange={(e) => setEditingItem({ ...editingItem, namaPelanggan: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  No. WhatsApp / HP
                </label>
                <input
                  type="text"
                  value={editingItem.noHp === '-' ? '' : editingItem.noHp}
                  onChange={(e) => setEditingItem({ ...editingItem, noHp: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Merek & Tipe HP
                </label>
                <input
                  type="text"
                  value={editingItem.tipeHp}
                  onChange={(e) => setEditingItem({ ...editingItem, tipeHp: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Keluhan / Kerusakan
                </label>
                <textarea
                  value={editingItem.keluhan}
                  onChange={(e) => setEditingItem({ ...editingItem, keluhan: e.target.value })}
                  rows={2}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Harga Sparepart (Rp)
                  </label>
                  <input
                    type="number"
                    value={editingItem.hargaSparepart || 0}
                    onChange={(e) => {
                      const sp = Number(e.target.value);
                      const total = sp + (editingItem.jasaServis || 0);
                      setEditingItem({ ...editingItem, hargaSparepart: sp, totalBiaya: total });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Biaya Jasa (Rp)
                  </label>
                  <input
                    type="number"
                    value={editingItem.jasaServis}
                    onChange={(e) => {
                      const jasa = Number(e.target.value);
                      const total = (editingItem.hargaSparepart || 0) + jasa;
                      setEditingItem({ ...editingItem, jasaServis: jasa, totalBiaya: total });
                    }}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Uang Muka / DP (Rp)
                  </label>
                  <input
                    type="number"
                    value={editingItem.dp}
                    onChange={(e) => setEditingItem({ ...editingItem, dp: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Total Biaya
                  </label>
                  <div className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-cyan-400">
                    {formatRupiah(editingItem.totalBiaya)}
                  </div>
                </div>
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
