import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Sparkles, 
  Calendar, 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  DollarSign, 
  Plus, 
  Eye, 
  Trash2, 
  X,
  MessageCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Filter,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { LaporanTutupBuku, Karyawan, PengaturanToko, TransaksiKas } from '../types';
import { formatRupiah, formatDateToDMY, getTodayISO, convertISOToDMY, parseDateString } from '../services/db';

interface Props {
  totalPemasukan: number;
  totalPengeluaran: number;
  modalSparepartTerpakai: number;
  labaBersih: number;
  saldoKas: number;
  historiList: LaporanTutupBuku[];
  karyawanList: Karyawan[];
  kasList: TransaksiKas[];
  toko: PengaturanToko;
  isModeEditUnlocked: boolean;
  onTutupBuku: (tglMulai: string, tglSelesai: string) => void;
  onTambahHistoriManual: (data: LaporanTutupBuku) => void;
  onDeleteHistori: (id: number) => void;
  onProsesGaji: (nama: string, hp: string, laporan: LaporanTutupBuku, porsi: number, kasbon: number, bersih: number) => void;
  onExportBackup: () => Promise<string>;
  onImportRestore: (jsonString: string) => Promise<boolean>;
}

export const LaporanTab: React.FC<Props> = ({
  totalPemasukan,
  totalPengeluaran,
  modalSparepartTerpakai,
  labaBersih,
  saldoKas,
  historiList,
  karyawanList,
  kasList,
  toko,
  isModeEditUnlocked,
  onTutupBuku,
  onTambahHistoriManual,
  onDeleteHistori,
  onProsesGaji,
  onExportBackup,
  onImportRestore
}) => {
  // Modal Tutup Buku
  const [modalTutupBukuOpen, setModalTutupBukuOpen] = useState(false);
  const [tbMulai, setTbMulai] = useState(getTodayISO());
  const [tbSelesai, setTbSelesai] = useState(getTodayISO());

  // Modal Tambah Histori Manual
  const [modalManualOpen, setModalManualOpen] = useState(false);
  const [manMulai, setManMulai] = useState(getTodayISO());
  const [manSelesai, setManSelesai] = useState(getTodayISO());
  const [manPemasukan, setManPemasukan] = useState('');
  const [manPengeluaran, setManPengeluaran] = useState('');
  const [manModalSp, setManModalSp] = useState('0');

  // Modal Detail Histori
  const [selectedHistori, setSelectedHistori] = useState<LaporanTutupBuku | null>(null);

  // Modal Hitung Gaji
  const [modalGajiOpen, setModalGajiOpen] = useState(false);
  const [gajiNama, setGajiNama] = useState('');
  const [gajiHp, setGajiHp] = useState('');
  const [gajiMode, setGajiMode] = useState<'bagi_dua' | 'manual'>('bagi_dua');
  const [gajiPorsiManual, setGajiPorsiManual] = useState<number>(0);
  const [gajiKasbonDetected, setGajiKasbonDetected] = useState<number>(0);

  // Modal Preview Laporan
  const [modalPreviewOpen, setModalPreviewOpen] = useState(false);

  // Modal Slip Gaji WA
  const [slipData, setSlipData] = useState<{
    nama: string;
    hp: string;
    laporan: LaporanTutupBuku;
    porsi: number;
    kasbon: number;
    bersih: number;
  } | null>(null);

  // Backup & Restore
  const [backupText, setBackupText] = useState('');
  const [restoreText, setRestoreText] = useState('');
  const [copiedBackup, setCopiedBackup] = useState(false);

  // Filter jangkauan bulan untuk grafik batang
  const [chartRange, setChartRange] = useState<'6_bulan' | '12_bulan' | 'semua'>('6_bulan');

  // Aggregasi data bulanan untuk visualisasi performa keuangan (Pemasukan, Pengeluaran, Laba Bersih)
  const monthlyData = useMemo(() => {
    const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const BULAN_FULL = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // Map: 'YYYY-MM' => { pem: number, peng: number, laba: number, txCount: number }
    const monthMap = new Map<string, { pem: number; peng: number; laba: number; txCount: number }>();

    // 1. Ambil data dari histori tutup buku masa lalu
    historiList.forEach((h) => {
      const d = parseDateString(h.tglMulai || h.tglSelesai);
      if (isNaN(d.getTime()) || d.getTime() === 0) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthMap.get(key) || { pem: 0, peng: 0, laba: 0, txCount: 0 };
      const pem = h.totalPemasukan || 0;
      const peng = h.totalPengeluaran || 0;
      const net = (h.labaBersih !== undefined && h.labaBersih !== null) 
        ? h.labaBersih 
        : (h.sisaSaldoAkhir !== undefined ? h.sisaSaldoAkhir : (pem - peng));
      
      existing.pem += pem;
      existing.peng += peng;
      existing.laba += net;
      existing.txCount += (h.rincianKas?.length || 1);
      monthMap.set(key, existing);
    });

    // 2. Ambil data transaksi kas berjalan saat ini
    kasList.forEach((k) => {
      const d = parseDateString(k.tanggal);
      if (isNaN(d.getTime()) || d.getTime() === 0) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthMap.get(key) || { pem: 0, peng: 0, laba: 0, txCount: 0 };

      if (k.jenis === 'pemasukan') {
        existing.pem += (k.nominal || 0);
      } else if (k.jenis === 'pengeluaran') {
        const isGaji = (
          k.kategori === 'Gaji Karyawan' ||
          k.kategori === 'Bagi Hasil Karyawan' ||
          (k.keterangan && k.keterangan.toLowerCase().includes('gaji'))
        );
        // Exclude double-counting employee salary from operational expense
        if (!isGaji) {
          existing.peng += (k.nominal || 0);
        }
      }
      existing.txCount += 1;
      monthMap.set(key, existing);
    });

    // 3. Tentukan rentang bulan yang ditampilkan
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthCount = chartRange === '6_bulan' ? 6 : chartRange === '12_bulan' ? 12 : 24;
    const resultTimeline: Array<{
      key: string;
      bulan: string;
      bulanLengkap: string;
      pemasukan: number;
      pengeluaran: number;
      labaBersih: number;
      marginPersen: number;
      txCount: number;
    }> = [];

    const allKeys = new Set(monthMap.keys());
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      allKeys.add(k);
    }

    const sortedKeys = Array.from(allKeys).sort();
    const filteredKeys = chartRange === 'semua' 
      ? sortedKeys 
      : sortedKeys.slice(-monthCount);

    filteredKeys.forEach((key) => {
      const [yStr, mStr] = key.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10) - 1;
      const data = monthMap.get(key) || { pem: 0, peng: 0, laba: 0, txCount: 0 };
      
      const pem = data.pem;
      const peng = data.peng;
      const net = data.laba !== 0 ? data.laba : (pem - peng);
      const margin = pem > 0 ? Math.round((net / pem) * 100) : 0;

      resultTimeline.push({
        key,
        bulan: `${BULAN_SHORT[m]} ${String(y).slice(-2)}`,
        bulanLengkap: `${BULAN_FULL[m]} ${y}`,
        pemasukan: pem,
        pengeluaran: peng,
        labaBersih: net,
        marginPersen: margin,
        txCount: data.txCount
      });
    });

    let sumPem = 0;
    let sumPeng = 0;
    let sumLaba = 0;
    let activeMonthsCount = 0;

    resultTimeline.forEach((item) => {
      sumPem += item.pemasukan;
      sumPeng += item.pengeluaran;
      sumLaba += item.labaBersih;
      if (item.pemasukan > 0 || item.pengeluaran > 0) {
        activeMonthsCount += 1;
      }
    });

    const divisor = Math.max(1, activeMonthsCount || resultTimeline.length);
    const avgLaba = Math.round(sumLaba / divisor);
    const avgPem = Math.round(sumPem / divisor);
    const overallMargin = sumPem > 0 ? Math.round((sumLaba / sumPem) * 100) : 0;

    return {
      timeline: resultTimeline,
      sumPem,
      sumPeng,
      sumLaba,
      avgLaba,
      avgPem,
      overallMargin,
      activeMonthsCount
    };
  }, [historiList, kasList, chartRange]);

  // Calculate Forecasting Omset based on past periods
  const sortedHistori = [...historiList].sort((a, b) => parseDateString(a.tglMulai).getTime() - parseDateString(b.tglMulai).getTime());
  let forecastOmset = 0;
  let forecastInfo = 'Belum ada riwayat periode laporan (tutup buku) tersimpan.';

  if (sortedHistori.length > 0) {
    const N = Math.min(3, sortedHistori.length);
    let sumOmset = 0;
    for (let i = sortedHistori.length - N; i < sortedHistori.length; i++) {
      sumOmset += sortedHistori[i].totalPemasukan || 0;
    }
    forecastOmset = Math.round(sumOmset / N);
    const lastOmset = sortedHistori[sortedHistori.length - 1].totalPemasukan || 0;
    const diff = forecastOmset - lastOmset;
    const trendText = diff > 0 
      ? `▲ Potensi omset naik ${formatRupiah(diff)} dibanding periode lalu.`
      : diff < 0 
      ? `▼ Potensi omset turun ${formatRupiah(Math.abs(diff))} dibanding periode lalu.`
      : `= Tren omset stabil sebanding periode sebelumnya.`;
    forecastInfo = `Berdasarkan rata-rata performa ${N} periode tutup buku terakhir. ${trendText}`;
  } else if (totalPemasukan > 0) {
    forecastOmset = totalPemasukan;
    forecastInfo = `Diproyeksikan dari pemasukan periode aktif saat ini.`;
  }

  // Tutup Buku Form Submit
  const handleTutupBukuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTutupBuku(convertISOToDMY(tbMulai), convertISOToDMY(tbSelesai));
    setModalTutupBukuOpen(false);
  };

  // Manual Histori Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mas = parseFloat(manPemasukan) || 0;
    const kel = parseFloat(manPengeluaran) || 0;
    const sp = parseFloat(manModalSp) || 0;
    const laba = mas - kel - sp;

    onTambahHistoriManual({
      jenisArsip: 'SUSULAN_MANUAL',
      tglMulai: convertISOToDMY(manMulai),
      tglSelesai: convertISOToDMY(manSelesai),
      tglEksekusi: `${formatDateToDMY(new Date())} (Input Susulan)`,
      totalPemasukan: mas,
      totalPengeluaran: kel,
      modalSparepart: sp,
      labaBersih: laba,
      sisaSaldoAkhir: laba
    });

    setModalManualOpen(false);
    setManPemasukan('');
    setManPengeluaran('');
    setManModalSp('0');
  };

  // When typing name in Salary modal -> Auto detect employee & kasbon
  const handleKaryawanNameChange = (nameInput: string) => {
    setGajiNama(nameInput);
    const trimmed = nameInput.toLowerCase().trim();
    if (!trimmed) {
      setGajiKasbonDetected(0);
      return;
    }

    // Auto-match phone from Karyawan list
    const foundKaryawan = karyawanList.find(k => k.nama.toLowerCase().trim() === trimmed);
    if (foundKaryawan) {
      setGajiHp(foundKaryawan.noHp || '');
    }

    // Auto sum active kasbon from kas
    let totalKasbonKaryawan = 0;
    kasList.forEach(item => {
      if (
        item.kategori === 'Kasbon Karyawan' &&
        item.keterangan &&
        item.keterangan.toLowerCase().includes('kasbon') &&
        item.keterangan.toLowerCase().includes(trimmed) &&
        !item.keterangan.includes('[LUNAS_GAJI]')
      ) {
        totalKasbonKaryawan += item.nominal;
      }
    });

    setGajiKasbonDetected(totalKasbonKaryawan);
  };

  const handleOpenGajiFromLaporan = () => {
    if (!selectedHistori) return;
    const net = selectedHistori.labaBersih || selectedHistori.sisaSaldoAkhir || 0;
    setGajiPorsiManual(Math.round(net / 2));
    setGajiMode('bagi_dua');
    setModalGajiOpen(true);
  };

  const handleProsesGajiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHistori || !gajiNama.trim()) return;

    const net = selectedHistori.labaBersih || selectedHistori.sisaSaldoAkhir || 0;
    const porsi = gajiMode === 'bagi_dua' ? Math.round(net / 2) : gajiPorsiManual;
    const bersih = Math.max(0, porsi - gajiKasbonDetected);

    onProsesGaji(gajiNama.trim(), gajiHp.trim(), selectedHistori, porsi, gajiKasbonDetected, bersih);

    setModalGajiOpen(false);
    setSelectedHistori(null);

    // Show WhatsApp Slip preview
    setSlipData({
      nama: gajiNama.trim(),
      hp: gajiHp.trim(),
      laporan: selectedHistori,
      porsi,
      kasbon: gajiKasbonDetected,
      bersih
    });
  };

  const handleSendSlipWA = () => {
    if (!slipData) return;
    let noHp = (slipData.hp || '').replace(/[^0-9]/g, '');
    if (noHp.startsWith('0')) noHp = '62' + noHp.substring(1);

    const pesan = `*SLIP GAJI & LAPORAN PERIODE - ${toko.namaKonter}*\n` +
                  `-----------------------------------------\n` +
                  `👤 *Karyawan:* ${slipData.nama}\n` +
                  `📅 *Periode:* ${slipData.laporan.tglMulai} s/d ${slipData.laporan.tglSelesai}\n\n` +
                  `📊 *RINGKASAN PERIODE:*\n` +
                  `📥 Total Pemasukan: ${formatRupiah(slipData.laporan.totalPemasukan)}\n` +
                  `📤 Total Pengeluaran: ${formatRupiah(slipData.laporan.totalPengeluaran)}\n` +
                  `💵 Laba Bersih Toko: ${formatRupiah(slipData.laporan.labaBersih)}\n\n` +
                  `💰 *RINCIAN GAJI:*\n` +
                  `• Pembagian Laba/Gaji: ${formatRupiah(slipData.porsi)}\n` +
                  `• Potongan Kasbon: -${formatRupiah(slipData.kasbon)}\n` +
                  `-----------------------------------------\n` +
                  `✅ *GAJI BERSIH DITERIMA:* ${formatRupiah(slipData.bersih)}\n\n` +
                  `Terima kasih atas kerja kerasnya! 🙏`;

    window.open(`https://wa.me/${noHp}?text=${encodeURIComponent(pesan)}`, '_blank');
  };

  // Generate backup
  const handleGenerateBackup = async () => {
    const text = await onExportBackup();
    setBackupText(text);
  };

  const handleCopyBackup = () => {
    if (!backupText) return;
    navigator.clipboard.writeText(backupText);
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  const handleExecuteRestore = async () => {
    if (!restoreText.trim()) return;
    const ok = await onImportRestore(restoreText.trim());
    if (ok) {
      setRestoreText('');
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Title */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>Laporan Keuntungan, Tutup Buku & Slip Gaji</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Analisis laba bersih, prediksi omset, kalkulasi bagi hasil, dan backup anti-hilang.
          </p>
        </div>
      </div>

      {/* Forecasting Card */}
      <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/70 border border-indigo-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Prediksi Omset Periode / Bulan Depan
          </span>
          <span className="text-xl">🔮</span>
        </div>
        <div className="text-3xl font-extrabold text-white tracking-tight mt-2 text-cyan-300">
          {formatRupiah(forecastOmset)}
        </div>
        <p className="text-xs text-indigo-200/80 mt-2 font-medium">
          {forecastInfo}
        </p>
      </div>

      {/* Visualisasi Grafik Batang Bulanan (Recharts: Laba Bersih, Pemasukan, Pengeluaran) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        
        {/* Header Grafik & Filter Periode */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Grafik Batang Bulanan: Tren Performa Keuangan Toko</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Perbandingan tren Laba Bersih, Pemasukan (Omset), dan Pengeluaran operasional toko.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setChartRange('6_bulan')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                chartRange === '6_bulan'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              6 Bulan
            </button>
            <button
              onClick={() => setChartRange('12_bulan')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                chartRange === '12_bulan'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              12 Bulan
            </button>
            <button
              onClick={() => setChartRange('semua')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                chartRange === 'semua'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua
            </button>
          </div>
        </div>

        {/* Ringkasan Akumulasi Periode Grafik */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="bg-slate-950/80 border border-emerald-500/20 rounded-xl p-3">
            <span className="text-[10px] font-semibold text-emerald-400 block uppercase tracking-wider">
              Total Pemasukan
            </span>
            <div className="text-sm sm:text-base font-black text-emerald-400 mt-0.5">
              {formatRupiah(monthlyData.sumPem)}
            </div>
            <span className="text-[10px] text-slate-500">Omset toko terakumulasi</span>
          </div>

          <div className="bg-slate-950/80 border border-rose-500/20 rounded-xl p-3">
            <span className="text-[10px] font-semibold text-rose-400 block uppercase tracking-wider">
              Total Pengeluaran
            </span>
            <div className="text-sm sm:text-base font-black text-rose-400 mt-0.5">
              {formatRupiah(monthlyData.sumPeng)}
            </div>
            <span className="text-[10px] text-slate-500">Biaya operasional toko</span>
          </div>

          <div className="bg-slate-950/80 border border-cyan-500/20 rounded-xl p-3">
            <span className="text-[10px] font-semibold text-cyan-400 block uppercase tracking-wider">
              Total Laba Bersih
            </span>
            <div className="text-sm sm:text-base font-black text-cyan-300 mt-0.5">
              {formatRupiah(monthlyData.sumLaba)}
            </div>
            <span className="text-[10px] text-slate-500">Keuntungan riil toko</span>
          </div>

          <div className="bg-slate-950/80 border border-indigo-500/20 rounded-xl p-3">
            <span className="text-[10px] font-semibold text-indigo-300 block uppercase tracking-wider">
              Rata-Rata Laba / Bln
            </span>
            <div className="text-sm sm:text-base font-black text-indigo-300 mt-0.5">
              {formatRupiah(monthlyData.avgLaba)}
            </div>
            <span className="text-[10px] text-indigo-400/80 font-bold">
              Margin Rata-rata: {monthlyData.overallMargin}%
            </span>
          </div>
        </div>

        {/* Visualisasi Recharts BarChart */}
        <div className="w-full pt-2">
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData.timeline}
                margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                <XAxis 
                  dataKey="bulan" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                    return `${val}`;
                  }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const dataItem = payload[0]?.payload;
                      return (
                        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-2xl shadow-2xl text-xs space-y-2 backdrop-blur-md min-w-[210px]">
                          <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between">
                            <span className="font-extrabold text-white text-xs">{dataItem?.bulanLengkap || label}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              (dataItem?.labaBersih || 0) >= 0 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              Margin: {dataItem?.marginPersen || 0}%
                            </span>
                          </div>

                          <div className="space-y-1 text-[11px]">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-400 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0" />
                                Pemasukan:
                              </span>
                              <span className="font-bold text-emerald-400">
                                {formatRupiah(dataItem?.pemasukan || 0)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-400 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shrink-0" />
                                Pengeluaran:
                              </span>
                              <span className="font-bold text-rose-400">
                                {formatRupiah(dataItem?.pengeluaran || 0)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
                              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 shrink-0" />
                                Laba Bersih:
                              </span>
                              <span className={`font-black text-xs ${
                                (dataItem?.labaBersih || 0) >= 0 ? 'text-cyan-300' : 'text-rose-400'
                              }`}>
                                {formatRupiah(dataItem?.labaBersih || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }} 
                />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                  iconType="circle" 
                />
                <Bar 
                  dataKey="pemasukan" 
                  name="Pemasukan" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  dataKey="pengeluaran" 
                  name="Pengeluaran" 
                  fill="#f43f5e" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  dataKey="labaBersih" 
                  name="Laba Bersih" 
                  fill="#06b6d4" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabel Rincian Data Performa Bulanan */}
        <div className="overflow-x-auto pt-1">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
              <tr>
                <th className="py-2.5 px-3">Bulan</th>
                <th className="py-2.5 px-3">Pemasukan</th>
                <th className="py-2.5 px-3">Pengeluaran</th>
                <th className="py-2.5 px-3">Laba Bersih</th>
                <th className="py-2.5 px-3 text-right">Margin (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              {monthlyData.timeline.map((row) => (
                <tr key={row.key} className="hover:bg-slate-800/40 transition">
                  <td className="py-2 px-3 font-semibold text-white whitespace-nowrap">
                    {row.bulanLengkap}
                  </td>
                  <td className="py-2 px-3 text-emerald-400 font-medium whitespace-nowrap">
                    {formatRupiah(row.pemasukan)}
                  </td>
                  <td className="py-2 px-3 text-rose-400 font-medium whitespace-nowrap">
                    {formatRupiah(row.pengeluaran)}
                  </td>
                  <td className={`py-2 px-3 font-bold whitespace-nowrap ${
                    row.labaBersih >= 0 ? 'text-cyan-300' : 'text-rose-400'
                  }`}>
                    {formatRupiah(row.labaBersih)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      row.marginPersen > 30 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : row.marginPersen > 0 
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {row.marginPersen}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Tutup Buku Trigger Banner */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <div className="font-bold text-sm text-white">Buat Laporan Periode (Tutup Buku)</div>
          <div className="text-xs text-slate-400 mt-0.5">
            Mengarsipkan transaksi, merapikan buku kas baru, dan membawa sisa saldo kas ke periode berikutnya.
          </div>
        </div>
        <button
          onClick={() => setModalTutupBukuOpen(true)}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
        >
          📑 Eksekusi Tutup Buku Kas
        </button>
      </div>

      {/* Histori Tutup Buku Archives */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-white">
            Histori Periode Tutup Buku ({historiList.length})
          </h3>
          <button
            onClick={() => setModalManualOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Histori Terlewat</span>
          </button>
        </div>

        {historiList.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            Belum ada arsip laporan tutup buku tersimpan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                <tr>
                  <th className="py-3 px-4">Periode Laporan</th>
                  <th className="py-3 px-4">Total Pemasukan</th>
                  <th className="py-3 px-4">Total Pengeluaran</th>
                  <th className="py-3 px-4">Laba Bersih</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {historiList.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-white">{h.tglMulai} s/d {h.tglSelesai}</div>
                      <div className="text-[10px] text-slate-500">{h.tglEksekusi}</div>
                    </td>

                    <td className="py-3 px-4 text-emerald-400 font-semibold whitespace-nowrap">
                      {formatRupiah(h.totalPemasukan)}
                    </td>

                    <td className="py-3 px-4 text-rose-400 font-semibold whitespace-nowrap">
                      {formatRupiah(h.totalPengeluaran)}
                    </td>

                    <td className="py-3 px-4 text-cyan-300 font-extrabold whitespace-nowrap">
                      {formatRupiah(h.labaBersih || h.sisaSaldoAkhir || 0)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedHistori(h)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold text-[11px] transition"
                        >
                          🔍 Detail & Gaji
                        </button>
                        <button
                          onClick={() => h.id && onDeleteHistori(h.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded-lg transition"
                          title="Hapus Arsip Laporan"
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

      {/* Active Period Financial Breakdown */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <span>Rincian Keuangan Toko (Periode Aktif)</span>
          </h3>
          <button
            onClick={() => setModalPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Preview & Cetak Laporan</span>
          </button>
        </div>

        <div className="space-y-2.5 text-xs text-slate-300 font-mono">
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span>Total Pemasukan Kas:</span>
            <span className="font-bold text-emerald-400">{formatRupiah(totalPemasukan)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span>Total Pengeluaran Kas (Eks. Kasbon):</span>
            <span className="font-bold text-rose-400">-{formatRupiah(totalPengeluaran)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span>Modal Sparepart Terpakai:</span>
            <span className="font-bold text-amber-400">-{formatRupiah(modalSparepartTerpakai)}</span>
          </div>
          <div className="flex justify-between py-2 text-sm font-sans font-extrabold text-white bg-slate-950/60 px-3 rounded-xl border border-slate-800">
            <span className="text-cyan-400">LABA BERSIH TOKO:</span>
            <span className="text-cyan-300 text-base">{formatRupiah(labaBersih)}</span>
          </div>
        </div>
      </div>

      {/* Backup & Restore Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div>
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Backup & Restore Aman (Anti-Hilang Data)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Simpan data toko ke format teks JSON cadangan agar data kasir Anda selalu aman meskipun ganti HP atau browser dibersihkan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Backup */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Cadangkan Data (Export)</span>
              <button
                onClick={handleGenerateBackup}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition"
              >
                Buat Kode Backup
              </button>
            </div>
            <textarea
              readOnly
              rows={3}
              value={backupText}
              placeholder="Klik 'Buat Kode Backup' lalu salin teks yang muncul di sini..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-[11px] font-mono text-slate-300 focus:outline-none"
            />
            <button
              onClick={handleCopyBackup}
              disabled={!backupText}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-xs font-bold transition"
            >
              {copiedBackup ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedBackup ? 'Kode Berhasil Disalin!' : 'Salin Kode ke Clipboard'}</span>
            </button>
          </div>

          {/* Restore */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <span className="text-xs font-bold text-slate-300 block">Pulihkan Data (Restore)</span>
            <textarea
              rows={3}
              value={restoreText}
              onChange={(e) => setRestoreText(e.target.value)}
              placeholder="Tempel (paste) kode backup lama Anda di sini..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-[11px] font-mono text-slate-300 focus:outline-none"
            />
            <button
              onClick={handleExecuteRestore}
              disabled={!restoreText.trim()}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition shadow"
            >
              <Upload className="w-4 h-4" />
              <span>Pulihkan / Restore Data Sekarang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tutup Buku Modal */}
      {modalTutupBukuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl text-slate-100">
            <h3 className="font-bold text-sm text-cyan-400 mb-2">
              📑 Eksekusi Tutup Buku Periode Kas
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Semua transaksi kas akan diarsipkan ke histori. Kasbon aktif tetap dipertahankan, dan sisa uang kas akan dilanjutkan otomatis sebagai modal periode baru.
            </p>

            <form onSubmit={handleTutupBukuSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={tbMulai}
                  onChange={(e) => setTbMulai(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={tbSelesai}
                  onChange={(e) => setTbSelesai(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  ⚡ Proses Tutup Buku
                </button>
                <button
                  type="button"
                  onClick={() => setModalTutupBukuOpen(false)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Histori Modal */}
      {modalManualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl text-slate-100">
            <h3 className="font-bold text-sm text-emerald-400 mb-2">
              ➕ Input Histori Laporan Terlewat
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Catat rekapitulasi gajian atau tutup buku periode lalu yang belum sempat diinput.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Dari Tanggal</label>
                  <input
                    type="date"
                    value={manMulai}
                    onChange={(e) => setManMulai(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={manSelesai}
                    onChange={(e) => setManSelesai(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Total Pemasukan (Rp)</label>
                <input
                  type="number"
                  value={manPemasukan}
                  onChange={(e) => setManPemasukan(e.target.value)}
                  placeholder="Contoh: 2500000"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Total Pengeluaran (Rp)</label>
                <input
                  type="number"
                  value={manPengeluaran}
                  onChange={(e) => setManPengeluaran(e.target.value)}
                  placeholder="Contoh: 1000000"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Modal Sparepart Terpakai (Rp)</label>
                <input
                  type="number"
                  value={manModalSp}
                  onChange={(e) => setManModalSp(e.target.value)}
                  placeholder="Contoh: 500000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Simpan Histori
                </button>
                <button
                  type="button"
                  onClick={() => setModalManualOpen(false)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Histori Modal */}
      {selectedHistori && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-cyan-400">
                📑 Rincian Laporan Periode
              </h3>
              <button 
                onClick={() => setSelectedHistori(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white text-slate-900 p-4 rounded-xl font-mono text-xs space-y-2 border border-slate-200">
              <div className="text-center font-bold pb-2 border-b border-dashed border-slate-400">
                {selectedHistori.tglMulai} s/d {selectedHistori.tglSelesai}
              </div>
              <div className="flex justify-between">
                <span>Total Pemasukan:</span>
                <span className="font-bold text-emerald-700">{formatRupiah(selectedHistori.totalPemasukan)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Pengeluaran:</span>
                <span className="font-bold text-rose-700">{formatRupiah(selectedHistori.totalPengeluaran)}</span>
              </div>
              <div className="flex justify-between">
                <span>Modal Sparepart:</span>
                <span>{formatRupiah(selectedHistori.modalSparepart || 0)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm pt-2 border-t border-dashed border-slate-400 text-blue-800">
                <span>Laba Bersih:</span>
                <span>{formatRupiah(selectedHistori.labaBersih || selectedHistori.sisaSaldoAkhir || 0)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={handleOpenGajiFromLaporan}
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                💵 Hitung & Ambil Gaji Periode Ini
              </button>
              <button
                onClick={() => setSelectedHistori(null)}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calculate Salary Modal */}
      {modalGajiOpen && selectedHistori && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl text-slate-100">
            <h3 className="font-bold text-sm text-cyan-400 mb-1">
              💵 Ambil Gaji dari Laporan Periode
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Periode: {selectedHistori.tglMulai} s/d {selectedHistori.tglSelesai}
            </p>

            <form onSubmit={handleProsesGajiSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nama Karyawan / Teknisi
                </label>
                <input
                  type="text"
                  value={gajiNama}
                  onChange={(e) => handleKaryawanNameChange(e.target.value)}
                  placeholder="Ketik nama karyawan..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  No. WhatsApp (Otomatis)
                </label>
                <input
                  type="text"
                  value={gajiHp}
                  onChange={(e) => setGajiHp(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Metode Pembagian Laba
                </label>
                <select
                  value={gajiMode}
                  onChange={(e) => setGajiMode(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="bagi_dua">Bagi 2 Sederhana (50% - 50%)</option>
                  <option value="manual">Atur Nominal Porsi Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Porsi Gaji Kotor (Rp)
                </label>
                <input
                  type="number"
                  readOnly={gajiMode === 'bagi_dua'}
                  value={gajiMode === 'bagi_dua' ? Math.round((selectedHistori.labaBersih || 0) / 2) : gajiPorsiManual}
                  onChange={(e) => setGajiPorsiManual(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Potongan Kasbon Terdeteksi (Rp)
                </label>
                <input
                  type="number"
                  value={gajiKasbonDetected}
                  onChange={(e) => setGajiKasbonDetected(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-amber-400 font-bold focus:outline-none"
                />
                <span className="text-[10px] text-amber-300/80 block mt-1">
                  Kasbon aktif otomatis lunas saat gaji diproses.
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Gaji Bersih Diterima:</span>
                <div className="text-xl font-black text-emerald-400">
                  {formatRupiah(
                    Math.max(
                      0,
                      (gajiMode === 'bagi_dua' ? Math.round((selectedHistori.labaBersih || 0) / 2) : gajiPorsiManual) - gajiKasbonDetected
                    )
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Hanya memotong saldo uang real kas toko, tidak dimasukkan ke hitungan pengeluaran.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Proses & Buat Slip Gaji
                </button>
                <button
                  type="button"
                  onClick={() => setModalGajiOpen(false)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slip Gaji WA Preview Modal */}
      {slipData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl text-slate-100">
            <div className="bg-white text-slate-900 p-4 rounded-xl font-mono text-xs space-y-2 border border-slate-200">
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <h3 className="font-extrabold text-sm">{toko.namaKonter}</h3>
                <p className="text-[10px] text-slate-600">SLIP GAJI & RINGKASAN PERIODE</p>
              </div>

              <div className="flex justify-between">
                <span>Karyawan:</span>
                <span className="font-bold">{slipData.nama}</span>
              </div>
              <div className="flex justify-between">
                <span>Periode:</span>
                <span>{slipData.laporan.tglMulai} s/d {slipData.laporan.tglSelesai}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 border-t border-dashed border-slate-300">
                <span>Laba Bersih Toko:</span>
                <span>{formatRupiah(slipData.laporan.labaBersih)}</span>
              </div>
              <div className="flex justify-between">
                <span>Porsi Gaji:</span>
                <span>{formatRupiah(slipData.porsi)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Potongan Kasbon:</span>
                <span>-{formatRupiah(slipData.kasbon)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm pt-2 border-t border-dashed border-slate-400 text-emerald-700">
                <span>Gaji Bersih:</span>
                <span>{formatRupiah(slipData.bersih)}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleSendSlipWA}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim via WhatsApp</span>
              </button>
              <button
                onClick={() => setSlipData(null)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Financial Report Modal */}
      {modalPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl text-slate-100">
            <div id="printable-report" className="bg-white text-slate-900 p-5 rounded-xl font-mono text-xs space-y-2 border border-slate-200">
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <h3 className="font-extrabold text-sm">{toko.namaKonter}</h3>
                <p className="text-[10px] text-slate-600">LAPORAN REKAPITULASI KEUANGAN</p>
                <p className="text-[10px] text-slate-600">WA: {toko.hpKonter}</p>
              </div>

              <div className="flex justify-between text-[11px]">
                <span>Periode:</span>
                <span className="font-bold">Periode Aktif Toko</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Tgl Cetak:</span>
                <span>{formatDateToDMY(new Date())}</span>
              </div>

              <div className="py-2 space-y-1.5 border-t border-b border-dashed border-slate-400">
                <div className="flex justify-between">
                  <span>Total Pemasukan:</span>
                  <span className="font-bold text-emerald-700">{formatRupiah(totalPemasukan)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Pengeluaran:</span>
                  <span className="font-bold text-rose-700">-{formatRupiah(totalPengeluaran)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Modal Sparepart:</span>
                  <span className="font-bold text-amber-700">-{formatRupiah(modalSparepartTerpakai)}</span>
                </div>
              </div>

              <div className="flex justify-between font-extrabold text-sm pt-1 text-blue-900">
                <span>LABA BERSIH:</span>
                <span>{formatRupiah(labaBersih)}</span>
              </div>

              <div className="text-center pt-3 text-[10px] text-slate-500 italic">
                Dokumen Rekapitulasi Resmi Keuangan Konter
              </div>
            </div>

            <div className="mt-4 flex gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / PDF</span>
              </button>
              <button
                onClick={() => setModalPreviewOpen(false)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
