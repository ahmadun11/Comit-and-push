import React, { useState } from 'react';
import { Settings, Save, X, Store, Phone, MapPin, KeyRound, Cloud, Bluetooth } from 'lucide-react';
import { PengaturanToko } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  toko: PengaturanToko;
  onSaveToko: (toko: PengaturanToko) => void;
  onOpenSyncModal?: () => void;
  onOpenBluetoothDiagnostic?: () => void;
}

export const PengaturanModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  toko, 
  onSaveToko,
  onOpenSyncModal,
  onOpenBluetoothDiagnostic
}) => {
  const [namaKonter, setNamaKonter] = useState(toko.namaKonter);
  const [hpKonter, setHpKonter] = useState(toko.hpKonter);
  const [alamatKonter, setAlamatKonter] = useState(toko.alamatKonter);
  const [pinKasir, setPinKasir] = useState(toko.pinKasir || localStorage.getItem('pinKasir') || '123456');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinKasir.trim() || '123456';
    localStorage.setItem('pinKasir', cleanPin);
    onSaveToko({
      namaKonter: namaKonter.trim() || 'A Teknisi',
      hpKonter: hpKonter.trim(),
      alamatKonter: alamatKonter.trim(),
      pinKasir: cleanPin
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-bold text-sm text-cyan-400">
            <Settings className="w-4 h-4" />
            <span>Pengaturan Toko & Nota</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Tools Buttons: Cloud Sync & Bluetooth Diagnostic */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {onOpenSyncModal && (
            <button
              type="button"
              onClick={() => { onClose(); onOpenSyncModal(); }}
              className="p-2.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-left transition flex items-center gap-2 text-xs font-semibold"
            >
              <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <div className="text-[11px] font-bold text-white leading-tight">Sinkron PC ⇄ HP</div>
                <div className="text-[10px] text-emerald-400/80">Status Cloud</div>
              </div>
            </button>
          )}

          {onOpenBluetoothDiagnostic && (
            <button
              type="button"
              onClick={() => { onClose(); onOpenBluetoothDiagnostic(); }}
              className="p-2.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-left transition flex items-center gap-2 text-xs font-semibold"
            >
              <Bluetooth className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="truncate">
                <div className="text-[11px] font-bold text-white leading-tight">Uji Bluetooth</div>
                <div className="text-[10px] text-cyan-400/80">Diagnostik Printer</div>
              </div>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Nama Konter / Toko
            </label>
            <div className="relative">
              <Store className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={namaKonter}
                onChange={(e) => setNamaKonter(e.target.value)}
                placeholder="Contoh: A Teknisi"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              No. WhatsApp / HP Toko
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={hpKonter}
                onChange={(e) => setHpKonter(e.target.value)}
                placeholder="Contoh: 0812-3456-7890"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
              <span>PIN Sandi Kasir (Untuk Login APK)</span>
              <span className="text-[10px] text-amber-400 font-normal">Default: 123456</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-amber-400" />
              <input
                type="password"
                value={pinKasir}
                onChange={(e) => setPinKasir(e.target.value)}
                placeholder="6 Digit PIN (contoh: 123456)"
                maxLength={10}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Digunakan saat login di aplikasi Android APK tanpa perlu akun Google atau keluar ke WhatsApp.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Alamat & Catatan Garansi (Muncul di Bawah Nota)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <textarea
                value={alamatKonter}
                onChange={(e) => setAlamatKonter(e.target.value)}
                rows={3}
                placeholder="Contoh: Jl. Merdeka No. 12 (Garansi Servis LCD 7 Hari. Bawa nota saat klaim)."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition shadow"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
            >
              Batal
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
