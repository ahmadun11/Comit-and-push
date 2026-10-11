import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink, 
  Globe, 
  AlertTriangle, 
  X, 
  Terminal, 
  KeyRound, 
  Settings2, 
  RotateCcw,
  CheckCircle2,
  Smartphone,
  MessageSquare
} from 'lucide-react';
import { 
  getCurrentDomain, 
  getRecommendedAuthorizedDomains, 
  getActiveFirebaseConfig, 
  saveCustomFirebaseConfig, 
  resetFirebaseConfig,
  defaultFirebaseConfig
} from '../services/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'google-auth' | 'phone-otp' | 'domain' | 'custom-config';
}

export const AuthorizedDomainModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  initialTab = 'phone-otp' 
}) => {
  const [activeTab, setActiveTab] = useState<'google-auth' | 'phone-otp' | 'domain' | 'custom-config'>(initialTab);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeConfig = getActiveFirebaseConfig();
  const [apiKey, setApiKey] = useState(activeConfig.apiKey);
  const [authDomain, setAuthDomain] = useState(activeConfig.authDomain);
  const [projectId, setProjectId] = useState(activeConfig.projectId);
  const [appId, setAppId] = useState(activeConfig.appId);

  if (!isOpen) return null;

  const currentDomain = getCurrentDomain();
  const domains = getRecommendedAuthorizedDomains();

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(domains.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomFirebaseConfig({
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      appId: appId.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleResetConfig = () => {
    resetFirebaseConfig();
    setApiKey(defaultFirebaseConfig.apiKey);
    setAuthDomain(defaultFirebaseConfig.authDomain);
    setProjectId(defaultFirebaseConfig.projectId);
    setAppId(defaultFirebaseConfig.appId);
    setSaveSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const firebaseAuthProvidersUrl = `https://console.firebase.google.com/project/${activeConfig.projectId}/authentication/providers`;
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${activeConfig.projectId}/authentication/settings`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-2xl rounded-2xl p-5 sm:p-6 shadow-2xl shadow-cyan-950/50 text-slate-100 max-h-[92vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 rounded-xl text-cyan-400">
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Panduan & Konfigurasi Login
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Panduan Login, SMS, WhatsApp & Firebase
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Proyek Firebase Aktif: <span className="font-mono text-cyan-300 font-bold">{activeConfig.projectId}</span>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 mb-5 gap-1 overflow-x-auto pb-0.5">
          <button
            onClick={() => setActiveTab('phone-otp')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition border-b-2 -mb-[1px] whitespace-nowrap ${
              activeTab === 'phone-otp'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Verifikasi SMS & WA</span>
          </button>

          <button
            onClick={() => setActiveTab('google-auth')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition border-b-2 -mb-[1px] whitespace-nowrap ${
              activeTab === 'google-auth'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Aktifkan Google Auth</span>
          </button>

          <button
            onClick={() => setActiveTab('domain')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition border-b-2 -mb-[1px] whitespace-nowrap ${
              activeTab === 'domain'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Authorized Domains</span>
          </button>

          <button
            onClick={() => setActiveTab('custom-config')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition border-b-2 -mb-[1px] whitespace-nowrap ${
              activeTab === 'custom-config'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Ganti Proyek</span>
          </button>
        </div>

        {/* TAB 1: PANDUAN SMS & WHATSAPP */}
        {activeTab === 'phone-otp' && (
          <div className="space-y-4">
            
            {/* WhatsApp Guide Card */}
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-300 text-xs">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Metode 1: Verifikasi WhatsApp OTP (Sangat Direkomendasikan & 100% Gratis)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Di Indonesia, verifikasi WhatsApp adalah pilihan terbaik untuk konter & servis HP karena tidak memerlukan pulsa SMS, tidak terkena biaya gateway, dan tidak terbatas kuota.
              </p>
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-[11px] space-y-1.5 text-slate-300">
                <div className="font-semibold text-emerald-300">Cara kerja di aplikasi ini:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Masukkan nomor WhatsApp Anda (contoh: <span className="font-mono text-white">08123456789</span>).</li>
                  <li>Sistem membuat kode OTP 6-angka acak secara otomatis.</li>
                  <li>Klik tombol <strong className="text-white">Kirim Kode OTP via WhatsApp</strong>. Aplikasi akan membuka WhatsApp dan menyiapkan pesan verifikasi resmi.</li>
                  <li>Ketik kode OTP tersebut pada kotak verifikasi di aplikasi, lalu klik <strong className="text-white">Verifikasi & Masuk</strong>.</li>
                </ul>
              </div>
            </div>

            {/* Firebase SMS Guide Card */}
            <div className="p-3.5 bg-blue-950/40 border border-blue-500/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-300 text-xs">
                <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Metode 2: Verifikasi SMS Firebase Phone Auth</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Untuk mengirim SMS resmi melalui Google Firebase Phone Auth ke nomor HP:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] bg-slate-950/70 border border-slate-800 rounded-lg p-3">
                <li>
                  Buka{' '}
                  <a
                    href={firebaseAuthProvidersUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 underline font-semibold inline-flex items-center gap-1"
                  >
                    <span>Firebase Console &gt; Authentication &gt; Sign-in method</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>.
                </li>
                <li>
                  Klik penyedia <strong className="text-white">Phone</strong> lalu geser toggle <strong className="text-emerald-400">Enable</strong>.
                </li>
                <li>
                  <strong className="text-cyan-300">Tips Nomor Uji Coba Gratis:</strong> Pada bagian <strong className="text-white">Phone numbers for testing</strong>, Anda bisa menambahkan nomor tes tanpa pulsa/kuota SMS, contohnya nomor: <span className="font-mono text-white font-bold">+628123456789</span> dengan kode OTP: <span className="font-mono text-amber-300 font-bold">123456</span>.
                </li>
                <li>Klik tombol <strong className="text-white">Save</strong>.</li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <a
                href={firebaseAuthProvidersUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                <span>Buka Menu Phone Auth di Firebase Console</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: GOOGLE AUTH FIX */}
        {activeTab === 'google-auth' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Solusi Error: auth/operation-not-allowed</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Error ini terjadi saat tombol <strong className="text-white">Masuk dengan Akun Google</strong> diklik, tetapi opsi login Google belum diaktifkan di Firebase Console untuk proyek <span className="font-mono text-cyan-300 font-bold">{activeConfig.projectId}</span>.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs space-y-3">
              <div className="font-bold text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>4 Langkah Cepat Mengaktifkan Google Login:</span>
              </div>
              <ol className="list-decimal list-inside space-y-2.5 text-slate-300 text-[11px]">
                <li>
                  Buka tautan konsol:{' '}
                  <a 
                    href={firebaseAuthProvidersUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-cyan-400 underline font-semibold hover:text-cyan-300 inline-flex items-center gap-1"
                  >
                    <span>Firebase Console &gt; Authentication &gt; Sign-in method</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  Pada daftar <strong className="text-white">Sign-in providers</strong>, klik penyedia <strong className="text-cyan-300">Google</strong>.
                </li>
                <li>
                  Geser toggle <strong className="text-emerald-400">Enable</strong>, lalu pilih email Anda pada kolom <strong className="text-white">Project support email</strong>.
                </li>
                <li>
                  Klik tombol <strong className="text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Save (Simpan)</strong>.
                </li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <a
                href={firebaseAuthProvidersUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
              >
                <span>Buka Pengaturan Sign-in Method di Firebase</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: AUTHORIZED DOMAINS */}
        {activeTab === 'domain' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-950/50 via-slate-800/60 to-slate-900 border border-blue-500/30 rounded-xl p-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Domain Browser Saat Ini (Aktif)</span>
                  <div className="font-mono text-xs sm:text-sm font-bold text-emerald-400 break-all mt-0.5">
                    {currentDomain || 'localhost'}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(currentDomain, 999)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow shrink-0 self-start sm:self-auto"
                >
                  {copiedIndex === 999 ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Domain Ini</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Daftar Domain yang Perlu Didaftarkan:
                </h3>
                <button
                  onClick={handleCopyAll}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 underline underline-offset-2"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedAll ? 'Semua Tersalin!' : 'Salin Semua Sekaligus'}
                </button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {domains.map((dom, idx) => {
                  const isCurrent = dom === currentDomain;
                  return (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono transition ${
                        isCurrent 
                          ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200' 
                          : 'bg-slate-800/50 border-slate-700/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span>
                        <span className="truncate">{dom}</span>
                        {isCurrent && (
                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Aktif
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleCopy(dom, idx)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 transition shrink-0 ml-2"
                        title="Salin domain ini"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <a
                href={firebaseSettingsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
              >
                <span>Buka Tab Settings Authorized Domains</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOM FIREBASE CONFIG */}
        {activeTab === 'custom-config' && (
          <form onSubmit={handleSaveConfig} className="space-y-3.5 text-xs">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Jika Anda memiliki proyek Firebase sendiri, Anda dapat memasukkan konfigurasi proyek Anda di bawah ini:
            </p>

            {saveSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Pengaturan berhasil disimpan! Memuat ulang aplikasi...</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Project ID
              </label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="misal: konter-hp"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Auth Domain
                </label>
                <input
                  type="text"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  placeholder="project-id.firebaseapp.com"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  App ID
                </label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1:123456789:web:abcdef"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Simpan & Terapkan Proyek Ini
              </button>
              <button
                type="button"
                onClick={handleResetConfig}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Bawaan</span>
              </button>
            </div>
          </form>
        )}

        {/* Local Storage Offline Guarantee footer */}
        <div className="mt-5 p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Jaminan Mode Offline:</strong> Semua modul kasir, riwayat servis HP, stok sparepart, dan cetak nota fisik/PDF bekerja penuh tanpa koneksi internet atau tanpa akun Firebase via penyimpanan browser lokal (<span className="font-mono text-emerald-200">IndexedDB</span>).
          </div>
        </div>

      </div>
    </div>
  );
};
