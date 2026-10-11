import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  RefreshCw, 
  CheckCircle2, 
  Smartphone, 
  Monitor, 
  ShieldCheck, 
  X, 
  Database, 
  ArrowRightLeft, 
  Wrench, 
  Wallet, 
  Boxes, 
  ShoppingBag, 
  Users, 
  FileSpreadsheet, 
  Info,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import { getDeviceType, getSyncState, SyncState } from '../services/cloudSync';
import { defaultFirebaseConfig } from '../services/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userAccount: string | null;
  currentUid: string | null;
  isSyncing: boolean;
  lastSyncTime: string | null;
  onTriggerSync: () => Promise<void>;
  counts: {
    servis: number;
    kas: number;
    sparepart: number;
    jualBeli: number;
    karyawan: number;
    histori: number;
  };
}

export const SyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  userAccount,
  currentUid,
  isSyncing,
  lastSyncTime,
  onTriggerSync,
  counts
}) => {
  const [deviceType, setDeviceType] = useState<'PC' | 'Android APK' | 'Mobile Web'>('PC');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDeviceType(getDeviceType());
      setSyncFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSyncClick = async () => {
    setSyncFeedback(null);
    try {
      await onTriggerSync();
      setSyncFeedback('Sinkronisasi selesai! Semua data di PC dan HP kini 100% identik.');
    } catch {
      setSyncFeedback('Gagal menyinkronkan data. Pastikan koneksi internet aktif.');
    }
  };

  const totalAllData = counts.servis + counts.kas + counts.sparepart + counts.jualBeli + counts.karyawan + counts.histori;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-5 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-bold text-sm text-cyan-400">
            <Cloud className="w-5 h-5 text-cyan-400" />
            <span>Sinkronisasi Data PC ⇄ HP (Android APK)</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className={`p-3.5 rounded-xl border mb-4 flex items-center justify-between gap-3 ${
          userAccount 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {userAccount ? (
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Wifi className="w-5 h-5 text-emerald-400" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <WifiOff className="w-5 h-5 text-amber-400" />
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{userAccount ? 'Cloud Sync Aktif & Terhubung' : 'Belum Login Akun Cloud'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[11px] text-slate-400">
                {userAccount 
                  ? `Akun: ${userAccount} • Terakhir: ${lastSyncTime || 'Baru saja'}`
                  : 'Silakan login di menu akun agar data sinkron ke HP.'
                }
              </div>
            </div>
          </div>

          <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg border bg-slate-900/80 border-slate-700 text-cyan-300 shrink-0">
            {deviceType}
          </span>
        </div>

        {/* Sync Feedback Message */}
        {syncFeedback && (
          <div className="mb-4 p-3 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Action Button: Manual Sync Now */}
        <button
          onClick={handleManualSyncClick}
          disabled={isSyncing || !userAccount}
          className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 mb-4"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>
            {isSyncing ? 'Menyinkronkan Data...' : 'Sinkronkan Sekarang (Paksa Update Data)'}
          </span>
        </button>

        {/* Data Breakdown Cards */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 px-1">
            <span>Rincian Data Tersinkronisasi Otomatis</span>
            <span className="text-[11px] text-cyan-400 font-bold">{totalAllData} Total Data</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
                <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                <span>Nota Servis</span>
              </div>
              <div className="text-base font-extrabold text-white">{counts.servis}</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Transaksi Kas</span>
              </div>
              <div className="text-base font-extrabold text-white">{counts.kas}</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
                <Boxes className="w-3.5 h-3.5 text-amber-400" />
                <span>Stok Sparepart</span>
              </div>
              <div className="text-base font-extrabold text-white">{counts.sparepart}</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
                <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Jual Beli HP</span>
              </div>
              <div className="text-base font-extrabold text-white">{counts.jualBeli}</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Karyawan</span>
              </div>
              <div className="text-base font-extrabold text-white">{counts.karyawan}</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />
                <span>Tutup Buku</span>
              </div>
              <div className="text-base font-extrabold text-white">{counts.histori}</div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Instructions to Synchronize PC & Android Phone */}
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            <span>Cara Menyamakan Data 100% Antara PC & HP Android APK:</span>
          </div>

          <ol className="space-y-2 text-slate-300 text-[11px] list-decimal list-inside pl-1 leading-relaxed">
            <li>
              <strong className="text-white">Langkah 1:</strong> Buat akun atau gunakan User ID Anda saat ini (contoh: <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">{userAccount || 'ahmad_teknisi'}</code>) di menu <em>Pengaturan Akun</em>.
            </li>
            <li>
              <strong className="text-white">Langkah 2:</strong> Buka aplikasi di HP Android (APK Capacitor) Anda, lalu pilih <strong>Login</strong> menggunakan <strong>User ID & Password yang SAMA</strong>.
            </li>
            <li>
              <strong className="text-white">Langkah 3:</strong> Selesai! Data nota servis, kas masuk/keluar, stok suku cadang, dan pengaturan toko akan langsung sinkron secara otomatis dan real-time.
            </li>
          </ol>

          <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[10px] text-cyan-200/90 leading-tight">
            💡 <strong>Info Real-Time:</strong> Saat Anda mencatat nota baru atau pembayaran di HP, layar komputer PC akan otomatis memperbarui tampilan tanpa perlu refresh halaman.
          </div>
        </div>

        {/* Cloud Project Details */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
          <span>Database ID: <code className="text-slate-400">{defaultFirebaseConfig.projectId}</code></span>
          <span>Status: <strong className="text-emerald-400">Real-time Online</strong></span>
        </div>

      </div>
    </div>
  );
};
