import React, { useState, useRef, useEffect } from 'react';
import { 
  MoreVertical, 
  Users, 
  Settings, 
  Palette, 
  Unlock, 
  Lock, 
  LogOut, 
  User, 
  Smartphone,
  Wifi, 
  WifiOff,
  Bluetooth,
  Cloud,
  RefreshCw,
  Check
} from 'lucide-react';
import { PengaturanToko } from '../types';

interface Props {
  toko: PengaturanToko;
  userAccount: string | null;
  isModeEditUnlocked: boolean;
  onToggleModeEdit: () => void;
  onOpenKaryawan: () => void;
  onOpenPengaturan: () => void;
  onOpenVisual: () => void;
  onOpenAkun: () => void;
  onOpenBluetoothDiagnostic: () => void;
  onOpenSyncModal?: () => void;
  onTriggerSync: () => void;
  isSyncing?: boolean;
  lastSyncTime?: string | null;
  onLogout: () => void;
}

export const Header: React.FC<Props> = ({
  toko,
  userAccount,
  isModeEditUnlocked,
  onToggleModeEdit,
  onOpenKaryawan,
  onOpenPengaturan,
  onOpenVisual,
  onOpenAkun,
  onOpenBluetoothDiagnostic,
  onOpenSyncModal,
  onTriggerSync,
  isSyncing = false,
  lastSyncTime = null,
  onLogout
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-cyan-900/40 px-3 sm:px-4 py-3 shadow-lg no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-cyan-500/30 shadow-md shadow-cyan-500/20 bg-slate-950 flex items-center justify-center shrink-0">
            <img 
              src="/icon.png" 
              alt="Logo Toko" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }} 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base md:text-lg tracking-tight text-white leading-none">
                {toko.namaKonter || 'A Teknisi'}
              </h1>
              {isModeEditUnlocked && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Mode Hapus Terbuka
                </span>
              )}
            </div>
            <div 
              onClick={onOpenSyncModal} 
              className={`flex items-center gap-2 mt-1 ${onOpenSyncModal ? 'cursor-pointer hover:opacity-80 transition' : ''}`}
              title="Klik untuk melihat detail & status sinkronisasi PC ⇄ HP"
            >
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                {userAccount ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-medium truncate max-w-[120px] sm:max-w-[200px]">
                      {userAccount}
                    </span>
                    {lastSyncTime && (
                      <span className="hidden lg:inline text-[10px] text-slate-500">
                        • Sinkron: {lastSyncTime}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-amber-400" />
                    <span className="text-amber-400 font-medium">Mode Lokal / Offline</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Real-time Cloud Sync Button (PC ⇄ HP) */}
          <button
            onClick={onOpenSyncModal || onTriggerSync}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition shadow-sm ${
              isSyncing
                ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
                : 'bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-500/30 text-emerald-300'
            }`}
            title={`Status & Sinkronisasi PC ⇄ HP Android ${lastSyncTime ? `(Terakhir: ${lastSyncTime})` : ''}`}
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="hidden sm:inline">
              {isSyncing ? 'Sinkron...' : 'Sinkron PC ⇄ HP'}
            </span>
          </button>

          {/* Quick Lock/Unlock Toggle Button */}
          <button
            onClick={onToggleModeEdit}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isModeEditUnlocked
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 shadow-sm shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title={isModeEditUnlocked ? 'Mode hapus & edit terbuka (Klik untuk mengunci)' : 'Fitur hapus terkunci (Klik untuk membuka kunci)'}
          >
            {isModeEditUnlocked ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Kunci Hapus</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Buka Kunci</span>
              </>
            )}
          </button>

          {/* Quick Bluetooth Diagnostic Button */}
          <button
            onClick={onOpenBluetoothDiagnostic}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 text-xs font-semibold transition"
            title="Diagnostik Bluetooth & Cetak Struk (Cek Web Bluetooth / SecurityError)"
          >
            <Bluetooth className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-slate-200">Diagnostik BT</span>
          </button>

          {/* Quick Account Setup Button */}
          <button
            onClick={onOpenAkun}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition"
            title="Pengaturan User ID & Akun"
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>Akun & User ID</span>
          </button>

          {/* Menu Dropdown Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              aria-label="Menu Opsi"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 text-xs text-slate-200 z-50 animate-in fade-in zoom-in-95 duration-150">
                
                <button
                  onClick={() => { setMenuOpen(false); if (onOpenSyncModal) onOpenSyncModal(); else onTriggerSync(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-emerald-950/60 hover:text-emerald-300 text-left font-medium transition"
                >
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  <span>☁️ Status & Sinkron PC ⇄ HP</span>
                </button>

                <button
                  onClick={() => { setMenuOpen(false); onOpenBluetoothDiagnostic(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-cyan-950/60 hover:text-cyan-300 text-left font-medium transition"
                >
                  <Bluetooth className="w-4 h-4 text-cyan-400" />
                  <span>🔍 Diagnostik Bluetooth & Cetak</span>
                </button>

                <button
                  onClick={() => { setMenuOpen(false); onOpenAkun(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-left font-medium transition"
                >
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>👤 Pengaturan Akun & User ID</span>
                </button>

                <button
                  onClick={() => { setMenuOpen(false); onOpenKaryawan(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-left font-medium transition"
                >
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>👥 Kelola Data Karyawan</span>
                </button>

                <button
                  onClick={() => { setMenuOpen(false); onOpenPengaturan(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-left font-medium transition"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>⚙ Pengaturan Konter & Nota</span>
                </button>

                <button
                  onClick={() => { setMenuOpen(false); onOpenVisual(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-left font-medium transition"
                >
                  <Palette className="w-4 h-4 text-purple-400" />
                  <span>🎨 Edit Background & Opacity</span>
                </button>

                <button
                  onClick={() => { setMenuOpen(false); onToggleModeEdit(); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left font-medium transition ${
                    isModeEditUnlocked ? 'bg-amber-950/50 text-amber-300' : 'hover:bg-slate-800'
                  }`}
                >
                  {isModeEditUnlocked ? (
                    <>
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>🔒 Kunci Kembali Mode Hapus</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 text-amber-400" />
                      <span>🔓 Buka Kunci Mode Edit/Hapus</span>
                    </>
                  )}
                </button>

                <div className="border-t border-slate-800 my-1"></div>

                <button
                  onClick={() => { setMenuOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 text-left font-medium transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>🚪 Keluar Akun / Lepas Sesi</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
