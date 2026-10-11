import React, { useState, useMemo } from 'react';
import { 
  Smartphone, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Edit3, 
  Printer, 
  Share2, 
  AlertCircle,
  X,
  Tag,
  ShieldAlert
} from 'lucide-react';
import { JualBeliHp, StatusJualBeli, PengaturanToko } from '../types';
import { formatRupiah, formatDateToDMY, getTodayISO } from '../services/db';
import { printBluetoothStrukJualBeli } from '../services/bluetoothPrinter';
import { openWhatsApp } from '../services/externalApp';

interface Props {
  jualBeliList: JualBeliHp[];
  toko: PengaturanToko;
  isModeEditUnlocked: boolean;
  onAddJualBeli: (data: Omit<JualBeliHp, 'id'>) => Promise<void>;
  onUpdateJualBeli: (data: JualBeliHp) => Promise<void>;
  onDeleteJualBeli: (id: number) => void | Promise<void>;
  onTandaiTerjual: (hp: JualBeliHp, hargaReal: number, metodeKas: 'Cash' | 'Transfer' | 'QRIS', pembeli?: string) => Promise<void>;
}

export const JualBeliTab: React.FC<Props> = ({
  jualBeliList,
  toko,
  isModeEditUnlocked,
  onAddJualBeli,
  onUpdateJualBeli,
  onDeleteJualBeli,
  onTandaiTerjual
}) => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | StatusJualBeli>('semua');

  // Modal Form (Add / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JualBeliHp | null>(null);

  // Form states
  const [formNamaHp, setFormNamaHp] = useState('');
  const [formImei, setFormImei] = useState('');
  const [formKondisi, setFormKondisi] = useState('Mulus / Lengkap');
  const [formHargaBeli, setFormHargaBeli] = useState('');
  const [formHargaJual, setFormHargaJual] = useState('');
  const [formStatus, setFormStatus] = useState<StatusJualBeli>('Tersedia');
  const [formCatatan, setFormCatatan] = useState('');

  // Modal Tandai Terjual
  const [modalTerjualOpen, setModalTerjualOpen] = useState(false);
  const [targetTerjualItem, setTargetTerjualItem] = useState<JualBeliHp | null>(null);
  const [terjualHargaReal, setTerjualHargaReal] = useState('');
  const [terjualMetode, setTerjualMetode] = useState<'Cash' | 'Transfer' | 'QRIS'>('Cash');
  const [terjualPembeli, setTerjualPembeli] = useState('');

  // Bluetooth Printing feedback
  const [printFeedback, setPrintFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormNamaHp('');
    setFormImei('');
    setFormKondisi('Mulus / Lengkap');
    setFormHargaBeli('');
    setFormHargaJual('');
    setFormStatus('Tersedia');
    setFormCatatan('');
    setModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (item: JualBeliHp) => {
    setEditingItem(item);
    setFormNamaHp(item.namaHp);
    setFormImei(item.imei || '');
    setFormKondisi(item.kondisi || 'Mulus / Lengkap');
    setFormHargaBeli(String(item.hargaBeli || ''));
    setFormHargaJual(String(item.hargaJual || ''));
    setFormStatus(item.status);
    setFormCatatan(item.catatan || '');
    setModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const beli = parseFloat(formHargaBeli) || 0;
    const jual = parseFloat(formHargaJual) || 0;
    const untung = jual - beli;

    if (editingItem && editingItem.id) {
      await onUpdateJualBeli({
        ...editingItem,
        namaHp: formNamaHp.trim(),
        imei: formImei.trim(),
        kondisi: formKondisi.trim(),
        hargaBeli: beli,
        hargaJual: jual,
        untung,
        status: formStatus,
        catatan: formCatatan.trim()
      });
    } else {
      await onAddJualBeli({
        namaHp: formNamaHp.trim(),
        imei: formImei.trim(),
        kondisi: formKondisi.trim(),
        hargaBeli: beli,
        hargaJual: jual,
        untung,
        status: formStatus,
        tanggalBeli: formatDateToDMY(new Date()),
        catatan: formCatatan.trim()
      });
    }
    setModalOpen(false);
  };

  // Open modal terjual
  const handleOpenTerjual = (item: JualBeliHp) => {
    setTargetTerjualItem(item);
    setTerjualHargaReal(String(item.hargaJual || ''));
    setTerjualMetode('Cash');
    setTerjualPembeli('');
    setModalTerjualOpen(true);
  };

  // Submit terjual
  const handleSubmitTerjual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTerjualItem) return;
    const hargaReal = parseFloat(terjualHargaReal) || targetTerjualItem.hargaJual;
    await onTandaiTerjual(targetTerjualItem, hargaReal, terjualMetode, terjualPembeli.trim());
    setModalTerjualOpen(false);
    setTargetTerjualItem(null);
  };

  // Bluetooth thermal print
  const handlePrintBluetooth = async (item: JualBeliHp) => {
    setPrintFeedback({ message: 'Menghubungkan ke Printer Bluetooth...', isError: false });
    const res = await printBluetoothStrukJualBeli(toko, {
      namaHp: item.namaHp,
      imei: item.imei,
      kondisi: item.kondisi,
      hargaJual: item.hargaJual,
      tanggalTerjual: item.tanggalTerjual || item.tanggalBeli,
      pembeli: item.pembeli,
      catatan: item.catatan
    });

    if (res.success) {
      setPrintFeedback({ message: 'Struk berhasil dicetak ke Printer Bluetooth!', isError: false });
    } else {
      setPrintFeedback({ message: res.error || 'Gagal mencetak struk bluetooth.', isError: true });
    }

    setTimeout(() => {
      setPrintFeedback(null);
    }, 4000);
  };

  // WhatsApp share
  const handleShareWA = (item: JualBeliHp) => {
    const text = `*BUKTI JUAL BELI SMARTPHONE - ${toko.namaKonter.toUpperCase()}*\n` +
                 `--------------------------------\n` +
                 `📱 *Unit:* ${item.namaHp}\n` +
                 `${item.imei ? `🔢 *IMEI:* ${item.imei}\n` : ''}` +
                 `${item.kondisi ? `✨ *Kondisi:* ${item.kondisi}\n` : ''}` +
                 `📅 *Tanggal:* ${item.tanggalTerjual || item.tanggalBeli}\n` +
                 `💰 *Harga Jual:* ${formatRupiah(item.hargaJual)}\n` +
                 `--------------------------------\n` +
                 `Garansi unit berlaku sesuai kesepakatan toko.\n` +
                 `Terima kasih telah bertransaksi di ${toko.namaKonter}! 🙏`;
    
    openWhatsApp(item.noHpPembeli || '', text);
  };

  // Filtered list
  const filteredList = useMemo(() => {
    return jualBeliList.filter(item => {
      const matchSearch = (
        item.namaHp.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.imei && item.imei.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.pembeli && item.pembeli.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.kondisi && item.kondisi.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      const matchStatus = statusFilter === 'semua' || item.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [jualBeliList, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    let stokCount = 0;
    let modalStok = 0;
    let terjualCount = 0;
    let totalUntungTerjual = 0;

    jualBeliList.forEach(item => {
      if (item.status === 'Tersedia') {
        stokCount += 1;
        modalStok += (item.hargaBeli || 0);
      } else if (item.status === 'Terjual') {
        terjualCount += 1;
        totalUntungTerjual += (item.untung || 0);
      }
    });

    return {
      stokCount,
      modalStok,
      terjualCount,
      totalUntungTerjual
    };
  }, [jualBeliList]);

  return (
    <div className="space-y-4">
      
      {/* Toast Feedback */}
      {printFeedback && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
          printFeedback.isError 
            ? 'bg-rose-950/80 border-rose-700/60 text-rose-200' 
            : 'bg-emerald-950/80 border-emerald-700/60 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {printFeedback.isError ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
            <span>{printFeedback.message}</span>
          </div>
          <button onClick={() => setPrintFeedback(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
          <span className="text-[10px] font-semibold text-slate-400 block">Stok HP Tersedia</span>
          <div className="text-lg font-black text-cyan-400 mt-0.5">{stats.stokCount} Unit</div>
          <span className="text-[10px] text-slate-500">Siap dijual</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
          <span className="text-[10px] font-semibold text-slate-400 block">Modal Stok Aktif</span>
          <div className="text-lg font-black text-amber-400 mt-0.5">{formatRupiah(stats.modalStok)}</div>
          <span className="text-[10px] text-slate-500">Nilai aset barang</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
          <span className="text-[10px] font-semibold text-slate-400 block">HP Terjual</span>
          <div className="text-lg font-black text-emerald-400 mt-0.5">{stats.terjualCount} Unit</div>
          <span className="text-[10px] text-slate-500">Transaksi laku</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
          <span className="text-[10px] font-semibold text-slate-400 block">Total Untung Bersih</span>
          <div className="text-lg font-black text-emerald-400 mt-0.5">{formatRupiah(stats.totalUntungTerjual)}</div>
          <span className="text-[10px] text-slate-500">Masuk riwayat kas</span>
        </div>
      </div>

      {/* Action Bar & Filter */}
      <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 justify-between items-stretch sm:items-center">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama HP, IMEI, pembeli, atau kondisi..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Add HP Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah HP Baru</span>
          </button>
        </div>

        {/* Filter Status Component */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px] mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Status:</span>
          </div>

          <button
            onClick={() => setStatusFilter('semua')}
            className={`px-3 py-1 rounded-xl font-bold transition shrink-0 ${
              statusFilter === 'semua'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Semua ({jualBeliList.length})
          </button>

          <button
            onClick={() => setStatusFilter('Tersedia')}
            className={`px-3 py-1 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'Tersedia'
                ? 'bg-blue-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Tersedia / Stok ({stats.stokCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('Terjual')}
            className={`px-3 py-1 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'Terjual'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            <span>Sudah Terjual ({stats.terjualCount})</span>
          </button>
        </div>
      </div>

      {/* List Card Units */}
      {filteredList.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-400">
          <Smartphone className="w-12 h-12 mx-auto text-slate-600 mb-2" />
          <h4 className="font-bold text-sm text-slate-300">Belum ada data Jual Beli HP</h4>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery || statusFilter !== 'semua'
              ? 'Tidak ada unit yang sesuai dengan filter pencarian.'
              : 'Klik "Tambah HP Baru" untuk mencatat unit masuk, harga beli, dan target untung.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredList.map((item) => {
            const isTerjual = item.status === 'Terjual';
            return (
              <div 
                key={item.id} 
                className={`bg-slate-900/90 border rounded-2xl p-4 space-y-3 relative overflow-hidden transition shadow-lg ${
                  isTerjual 
                    ? 'border-emerald-900/50 bg-gradient-to-b from-slate-900 to-emerald-950/20' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header Card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Tgl Beli: {item.tanggalBeli || '-'}
                    </span>
                    <h3 className="font-bold text-sm text-white leading-tight">
                      {item.namaHp}
                    </h3>
                  </div>

                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border shrink-0 ${
                    isTerjual
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-blue-500/20 border-blue-500/40 text-cyan-400'
                  }`}>
                    {item.status}
                  </span>
                </div>

                {/* Info Detail */}
                <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs font-mono">
                  {item.imei && (
                    <div className="flex justify-between text-slate-400">
                      <span>IMEI:</span>
                      <span className="text-slate-200">{item.imei}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-400">
                    <span>Kondisi:</span>
                    <span className="text-slate-300">{item.kondisi || '-'}</span>
                  </div>

                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>Harga Beli:</span>
                    <span className="text-amber-400 font-semibold">{formatRupiah(item.hargaBeli)}</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Harga Jual:</span>
                    <span className="text-white font-bold">{formatRupiah(item.hargaJual)}</span>
                  </div>

                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/80">
                    <span className="font-bold text-emerald-400">Untung / Laba:</span>
                    <span className="font-bold text-emerald-400">+{formatRupiah(item.untung)}</span>
                  </div>
                </div>

                {/* Terjual info */}
                {isTerjual && (
                  <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-2 text-[11px] text-emerald-300 space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-emerald-400/80">Tgl Terjual:</span>
                      <span className="font-semibold">{item.tanggalTerjual || '-'}</span>
                    </div>
                    {item.pembeli && (
                      <div className="flex justify-between">
                        <span className="text-emerald-400/80">Pembeli:</span>
                        <span className="font-semibold">{item.pembeli}</span>
                      </div>
                    )}
                  </div>
                )}

                {item.catatan && (
                  <p className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded-lg">
                    "{item.catatan}"
                  </p>
                )}

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between gap-1.5 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    {/* Cetak Bluetooth */}
                    <button
                      onClick={() => handlePrintBluetooth(item)}
                      title="Cetak Struk Bluetooth Thermal"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* Kirim WhatsApp */}
                    <button
                      onClick={() => handleShareWA(item)}
                      title="Kirim Struk via WhatsApp"
                      className="p-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 rounded-lg transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => handleOpenEdit(item)}
                      title="Edit Data Unit"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button (Mode Edit Only) */}
                    {isModeEditUnlocked && item.id && (
                      <button
                        onClick={() => onDeleteJualBeli(item.id!)}
                        title="Hapus Unit"
                        className="p-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-400 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Mark as Sold Button */}
                  {!isTerjual ? (
                    <button
                      onClick={() => handleOpenTerjual(item)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Terjual</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Kas Masuk
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Unit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-sm text-cyan-400">
                <Smartphone className="w-4 h-4" />
                <span>{editingItem ? 'Edit Data HP' : 'Tambah Unit HP Jual Beli'}</span>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nama / Tipe HP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNamaHp}
                  onChange={(e) => setFormNamaHp(e.target.value)}
                  placeholder="Contoh: Samsung A54 5G 8/256GB"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    IMEI (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formImei}
                    onChange={(e) => setFormImei(e.target.value)}
                    placeholder="15 digit IMEI"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Kondisi Unit
                  </label>
                  <input
                    type="text"
                    value={formKondisi}
                    onChange={(e) => setFormKondisi(e.target.value)}
                    placeholder="Fullset / Batangan / Mulus"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Harga Beli / Modal (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formHargaBeli}
                    onChange={(e) => setFormHargaBeli(e.target.value)}
                    placeholder="Contoh: 2500000"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-amber-300 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Harga Jual Target (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formHargaJual}
                    onChange={(e) => setFormHargaJual(e.target.value)}
                    placeholder="Contoh: 3000000"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-emerald-300 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Live Preview Untung */}
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Estimasi Untung / Margin:</span>
                <span className="font-extrabold text-emerald-400 text-sm">
                  {formatRupiah((parseFloat(formHargaJual) || 0) - (parseFloat(formHargaBeli) || 0))}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Status Ketersediaan
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as StatusJualBeli)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Tersedia">Tersedia (Stok Aktif)</option>
                  <option value="Terjual">Sudah Terjual</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Catatan / Kelengkapan Tambahan
                </label>
                <textarea
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  placeholder="Contoh: Garansi resmi masih 4 bulan, free casing"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Simpan HP Baru'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tandai Terjual (Auto Masuk Riwayat Kas) */}
      {modalTerjualOpen && targetTerjualItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl text-slate-100">
            <h3 className="font-bold text-sm text-emerald-400 mb-1 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>Tandai HP Telah Terjual</span>
            </h3>
            <p className="text-xs text-slate-300 font-semibold mb-3">
              {targetTerjualItem.namaHp}
            </p>

            <form onSubmit={handleSubmitTerjual} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Harga Jual Aktual (Rp)
                </label>
                <input
                  type="number"
                  value={terjualHargaReal}
                  onChange={(e) => setTerjualHargaReal(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-emerald-300 font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Metode Penerimaan Uang
                </label>
                <select
                  value={terjualMetode}
                  onChange={(e) => setTerjualMetode(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Cash">Cash (Tunai)</option>
                  <option value="Transfer">Transfer Bank</option>
                  <option value="QRIS">QRIS</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nama Pembeli (Opsional)
                </label>
                <input
                  type="text"
                  value={terjualPembeli}
                  onChange={(e) => setTerjualPembeli(e.target.value)}
                  placeholder="Contoh: Pak Budi"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Rincian Kas Info */}
              <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/40 text-xs space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Modal Beli:</span>
                  <span>{formatRupiah(targetTerjualItem.hargaBeli)}</span>
                </div>
                <div className="flex justify-between text-emerald-300 font-bold">
                  <span>Keuntungan Otomatis Masuk Kas:</span>
                  <span>
                    +{formatRupiah((parseFloat(terjualHargaReal) || targetTerjualItem.hargaJual) - targetTerjualItem.hargaBeli)}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400/80 pt-1 border-t border-emerald-800/40">
                  💡 Total uang penjualan ({formatRupiah(parseFloat(terjualHargaReal) || targetTerjualItem.hargaJual)}) akan langsung dicatat ke Riwayat Kas sebagai pemasukan.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Konfirmasi & Masuk Kas
                </button>
                <button
                  type="button"
                  onClick={() => setModalTerjualOpen(false)}
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
