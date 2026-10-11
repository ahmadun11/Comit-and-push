import React, { useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  Calendar, 
  UserCheck, 
  FileText, 
  Globe, 
  AlertCircle,
  PlusCircle,
  Clock,
  Wrench,
  Smartphone,
  Download
} from 'lucide-react';
import { TransaksiKas, ServisItem } from '../types';
import { formatRupiah, formatDateToDMY, getTodayISO, convertISOToDMY } from '../services/db';

interface Props {
  userAccount: string | null;
  saldoKas: number;
  totalKasbon: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  servisList: ServisItem[];
  onOpenKalkulator: () => void;
  onOpenDomainGuide: () => void;
  onSaveKasbon: (tgl: string, nama: string, nominal: number, ket: string) => void;
  onSwitchTab: (tab: any) => void;
}

export const DashboardTab: React.FC<Props> = ({
  userAccount,
  saldoKas,
  totalKasbon,
  totalPemasukan,
  totalPengeluaran,
  servisList,
  onOpenKalkulator,
  onOpenDomainGuide,
  onSaveKasbon,
  onSwitchTab
}) => {
  const [modalKasbonOpen, setModalKasbonOpen] = useState(false);
  const [ksbTgl, setKsbTgl] = useState(getTodayISO());
  const [ksbNama, setKsbNama] = useState('');
  const [ksbNominal, setKsbNominal] = useState('');
  const [ksbKet, setKsbKet] = useState('');

  const saldoPlusKasbon = saldoKas + totalKasbon;
  const servisBerjalan = servisList.filter(s => s.status === 'Dikerjakan' || s.status === 'Selesai');

  const handleKasbonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nom = parseFloat(ksbNominal) || 0;
    if (nom <= 0 || !ksbNama.trim()) return;
    onSaveKasbon(convertISOToDMY(ksbTgl), ksbNama.trim(), nom, ksbKet.trim());
    setModalKasbonOpen(false);
    setKsbNama('');
    setKsbNominal('');
    setKsbKet('');
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner: Connected User & Date */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-950/80 border border-blue-500/30 rounded-xl text-blue-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Akun Terhubung
            </div>
            <div className="text-sm font-bold text-cyan-300">
              {userAccount || 'Mode Lokal / Offline'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <a
            href="/api/download-zip"
            download="kasir-servis-hp-ahmad-teknisi.zip"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/30 to-cyan-600/30 hover:from-blue-600/50 hover:to-cyan-600/50 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition shadow-sm"
            title="Download Paket ZIP Proyek & Ikon untuk Build APK di PC"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Unduh ZIP (APK)</span>
          </a>

          <button
            onClick={onOpenDomainGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Authorized Domain</span>
          </button>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-300 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDateToDMY(new Date())}</span>
          </div>
        </div>
      </div>

      {/* Main Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Real Cash in Hand */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Total Saldo Kas (Uang Real)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Aktif
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {formatRupiah(saldoKas)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Uang fisik/rekening toko yang siap digunakan untuk operasional.
          </p>
        </div>

        {/* Kasbon Karyawan Aktif */}
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              Kasbon Karyawan Aktif
            </span>
            <button
              onClick={() => setModalKasbonOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] transition shadow"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Input Kasbon</span>
            </button>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">
            {formatRupiah(totalKasbon)}
          </div>
          <div className="text-[11px] text-slate-300 mt-2">
            Uang kas real toko telah dipotong kasbon ini. Saldo hak karyawan tetap utuh dan akan dipotong saat gajian.
          </div>
        </div>
      </div>

      {/* Pemasukan & Pengeluaran Counters */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Total Pemasukan</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-white">
            {formatRupiah(totalPemasukan)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Dari nota servis & penjualan</span>
        </div>

        <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-1">
            <TrendingDown className="w-4 h-4" />
            <span>Total Pengeluaran</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-white">
            {formatRupiah(totalPengeluaran)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Operasional, alat & sewa</span>
        </div>
      </div>

      {/* Quick Actions & Calculators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={onOpenKalkulator}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 text-slate-200 font-bold text-xs transition shadow"
        >
          <Calculator className="w-4 h-4 text-cyan-400" />
          <span>Kalkulator Cepat</span>
        </button>

        <button
          onClick={() => onSwitchTab('servis')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs transition shadow"
        >
          <Wrench className="w-4 h-4" />
          <span>+ Nota Servis Baru</span>
        </button>

        <button
          onClick={() => onSwitchTab('jual_beli')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition shadow shadow-emerald-500/10"
        >
          <Smartphone className="w-4 h-4" />
          <span>📱 Jual Beli HP</span>
        </button>
      </div>

      {/* Active Services List Preview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">
              Servis Berjalan / Menunggu ({servisBerjalan.length})
            </h3>
          </div>
          <button
            onClick={() => onSwitchTab('servis')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            Lihat Semua →
          </button>
        </div>

        {servisBerjalan.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
            Tidak ada unit servis yang sedang dikerjakan saat ini.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {servisBerjalan.slice(0, 5).map((s) => (
              <div 
                key={s.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-300">{s.noNota}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      s.status === 'Selesai' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="text-slate-300 font-medium mt-1">
                    {s.namaPelanggan} — <span className="text-slate-400">{s.tipeHp}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate max-w-xs">
                    Keluhan: {s.keluhan}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-white">
                    {formatRupiah(s.totalBiaya)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Sisa: {formatRupiah(s.totalBiaya - s.dp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kasbon Modal */}
      {modalKasbonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl text-slate-100">
            <h3 className="font-bold text-sm text-amber-400 mb-3">
              📝 Input Kasbon Karyawan Baru
            </h3>
            <form onSubmit={handleKasbonSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  value={ksbTgl}
                  onChange={(e) => setKsbTgl(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nama Karyawan
                </label>
                <input
                  type="text"
                  value={ksbNama}
                  onChange={(e) => setKsbNama(e.target.value)}
                  placeholder="Contoh: Andi"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nominal Kasbon (Rp)
                </label>
                <input
                  type="number"
                  value={ksbNominal}
                  onChange={(e) => setKsbNominal(e.target.value)}
                  placeholder="Contoh: 100000"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Keterangan / Catatan
                </label>
                <input
                  type="text"
                  value={ksbKet}
                  onChange={(e) => setKsbKet(e.target.value)}
                  placeholder="Contoh: Kasbon bensin & makan"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition shadow"
                >
                  Simpan Kasbon
                </button>
                <button
                  type="button"
                  onClick={() => setModalKasbonOpen(false)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
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
