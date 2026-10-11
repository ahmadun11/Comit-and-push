import React, { useState, useEffect } from 'react';
import { 
  Bluetooth, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  Smartphone, 
  Monitor, 
  Printer, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  Info,
  HelpCircle,
  Cpu,
  Layers,
  FileCode
} from 'lucide-react';
import { 
  getDiagnosticEnvironment, 
  runDiagnosticBluetoothProbe, 
  DiagnosticEnvironment, 
  DiagnosticProbeResult 
} from '../services/bluetoothDiagnostic';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const BluetoothDiagnosticModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [env, setEnv] = useState<DiagnosticEnvironment | null>(null);
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<DiagnosticProbeResult | null>(null);
  const [activeGuideTab, setActiveGuideTab] = useState<'capacitor' | 'pc' | 'printer'>('capacitor');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadEnvironment();
      setProbeResult(null);
    }
  }, [isOpen]);

  const loadEnvironment = async () => {
    const data = await getDiagnosticEnvironment();
    setEnv(data);
  };

  if (!isOpen) return null;

  const handleRunProbe = async () => {
    setProbing(true);
    setProbeResult(null);
    try {
      const res = await runDiagnosticBluetoothProbe();
      setProbeResult(res);
      // Auto-switch guide tab to match error type if applicable
      if (res.errorType === 'SECURITY_ERROR') {
        setActiveGuideTab('capacitor');
      } else if (res.errorType === 'NOT_FOUND_ERROR') {
        setActiveGuideTab('printer');
      }
    } catch (e: any) {
      setProbeResult({
        success: false,
        errorType: 'UNKNOWN_ERROR',
        title: 'Kesalahan Sistem',
        message: e?.message || 'Gagal menjalankan pemindaian diagnostik.',
        rootCauses: ['Terjadi kegagalan runtime.'],
        remedies: []
      });
    } finally {
      setProbing(false);
      loadEnvironment();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleTestPrintSpooler = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-5 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Diagnostik Bluetooth & Printer Thermal</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  v2.0
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Pemeriksaan runtime Web Bluetooth, Secure Context, & Solusi Capacitor APK / PC
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Runtime Environment Status Grid */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Status Runtime Lingkungan Saat Ini
            </span>
            <button 
              onClick={loadEnvironment}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Perbarui Status</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {/* 1. Secure Context */}
            <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Konteks Keamanan</span>
                {env?.isSecureContext ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>
              <div className={`font-bold text-xs ${env?.isSecureContext ? 'text-emerald-400' : 'text-rose-400'}`}>
                {env?.isSecureContext ? 'HTTPS / Aman' : 'HTTP Tidak Aman'}
              </div>
              <div className="text-[10px] text-slate-500 truncate font-mono">
                {env?.protocol}
              </div>
            </div>

            {/* 2. Web Bluetooth API */}
            <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Web Bluetooth API</span>
                {env?.hasWebBluetooth ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
              <div className={`font-bold text-xs ${env?.hasWebBluetooth ? 'text-emerald-400' : 'text-amber-400'}`}>
                {env?.hasWebBluetooth ? 'Tersedia di Browser' : 'Tidak Didukung'}
              </div>
              <div className="text-[10px] text-slate-500">
                {env?.hasWebBluetooth ? 'navigator.bluetooth OK' : 'Objek bluetooth nihil'}
              </div>
            </div>

            {/* 3. Adaptor Bluetooth Hardware */}
            <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Adaptor Bluetooth</span>
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="font-bold text-xs text-white">
                {env?.bluetoothAdapterAvailable === true 
                  ? 'Aktif (Siap)' 
                  : env?.bluetoothAdapterAvailable === false 
                  ? 'Non-aktif (OFF)' 
                  : 'Siap Pindai'}
              </div>
              <div className="text-[10px] text-slate-500">
                {env?.bluetoothAdapterAvailable === false ? 'Harap nyalakan BT' : 'Hardware terdeteksi'}
              </div>
            </div>

            {/* 4. Platform Wrapper */}
            <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Platform / Peramban</span>
                {env?.isMobile ? <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> : <Monitor className="w-3.5 h-3.5 text-cyan-400" />}
              </div>
              <div className="font-bold text-xs text-cyan-300 truncate">
                {env?.browserName}
              </div>
              <div className="text-[10px] text-slate-500">
                {env?.isCapacitor ? 'Capacitor Android' : env?.isMobile ? 'Perangkat Mobile' : 'Perangkat Desktop'}
              </div>
            </div>

            {/* 5. Web Serial Fallback (PC) */}
            <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Web Serial (USB/COM)</span>
                {env?.hasWebSerial ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="text-[10px] text-slate-500">-</span>
                )}
              </div>
              <div className={`font-bold text-xs ${env?.hasWebSerial ? 'text-emerald-400' : 'text-slate-400'}`}>
                {env?.hasWebSerial ? 'Didukung (PC)' : 'Tidak Tersedia'}
              </div>
              <div className="text-[10px] text-slate-500">
                {env?.hasWebSerial ? 'Kabel USB / COM3' : 'Khusus Chrome PC'}
              </div>
            </div>

            {/* 6. System Spooler Print (100% Guaranteed Fallback) */}
            <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Spooler Cetak 58mm</span>
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="font-bold text-xs text-emerald-400">
                Aktif (100% Stabil)
              </div>
              <div className="text-[10px] text-slate-500">
                Tanpa batas browser
              </div>
            </div>
          </div>
        </div>

        {/* Action Probe Section */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 mb-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-xs text-white flex items-center gap-2">
                <span>Uji Koneksi Bluetooth Runtime</span>
                <span className="text-[10px] text-amber-400 font-normal">
                  (Mendeteksi SecurityError / NotFoundError secara langsung)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Menguji pemanggilan <code>navigator.bluetooth.requestDevice()</code> untuk memverifikasi apakah browser Anda dapat memindai printer thermal.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRunProbe}
                disabled={probing}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                {probing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memindai...</span>
                  </>
                ) : (
                  <>
                    <Bluetooth className="w-3.5 h-3.5" />
                    <span>Mulai Uji Pindai</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleTestPrintSpooler}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 shrink-0"
                title="Uji dialog cetak sistem langsung"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Tes Cetak Sistem</span>
              </button>
            </div>
          </div>

          {/* Result Banner */}
          {probeResult && (
            <div className={`p-3.5 rounded-xl border space-y-2 animate-in fade-in duration-200 ${
              probeResult.success 
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                : probeResult.errorType === 'SECURITY_ERROR'
                ? 'bg-rose-950/60 border-rose-500/60 text-rose-200'
                : 'bg-amber-950/50 border-amber-500/50 text-amber-200'
            }`}>
              <div className="flex items-start gap-2.5">
                {probeResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : probeResult.errorType === 'SECURITY_ERROR' ? (
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold text-xs text-white">
                    {probeResult.title}
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-200">
                    {probeResult.message}
                  </p>
                  {probeResult.rawError && (
                    <div className="p-1.5 rounded bg-black/40 font-mono text-[10px] text-slate-300 break-all">
                      {probeResult.rawError}
                    </div>
                  )}
                </div>
              </div>

              {/* Root causes bullet points if failed */}
              {!probeResult.success && probeResult.rootCauses.length > 0 && (
                <div className="pt-1 border-t border-white/10 text-[11px] space-y-1">
                  <span className="font-bold text-white text-[10px] uppercase tracking-wider block">
                    Penyebab Utama:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                    {probeResult.rootCauses.map((cause, i) => (
                      <li key={i}>{cause}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Troubleshooting & Setup Guide Tabs */}
        <div className="space-y-3">
          <div className="flex border-b border-slate-800 text-xs font-semibold gap-1">
            <button
              onClick={() => setActiveGuideTab('capacitor')}
              className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 ${
                activeGuideTab === 'capacitor'
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Solusi Capacitor / APK Android</span>
            </button>

            <button
              onClick={() => setActiveGuideTab('printer')}
              className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 ${
                activeGuideTab === 'printer'
                  ? 'border-amber-400 text-amber-300 bg-amber-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Solusi NotFound & Printer 58mm</span>
            </button>

            <button
              onClick={() => setActiveGuideTab('pc')}
              className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 ${
                activeGuideTab === 'pc'
                  ? 'border-blue-400 text-blue-300 bg-blue-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Solusi PC & Spooler Cetak</span>
            </button>
          </div>

          {/* TAB 1: Solusi Capacitor / APK Android */}
          {activeGuideTab === 'capacitor' && (
            <div className="space-y-3 text-xs text-slate-300 animate-in fade-in duration-150">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span>1. Tambahkan Izin Bluetooth di AndroidManifest.xml</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Secara default, Android 12+ (API 31+) mewajibkan izin <code>BLUETOOTH_SCAN</code> dan <code>BLUETOOTH_CONNECT</code> agar WebView diizinkan mendeteksi printer thermal. Tambahkan tag berikut di dalam berkas <code>android/app/src/main/AndroidManifest.xml</code>:
                </p>

                <div className="relative">
                  <pre className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-mono text-cyan-300 overflow-x-auto">
{`<!-- Letakkan di dalam tag <manifest> -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<!-- Wajib untuk Android 12 / 13 / 14 / 15 -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />`}
                  </pre>
                  <button
                    onClick={() => handleCopy(`<!-- Letakkan di dalam tag <manifest> -->\n<uses-permission android:name="android.permission.BLUETOOTH" />\n<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />\n<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />\n<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />\n<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />`, 'manifest')}
                    className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] rounded text-slate-300 flex items-center gap-1 border border-slate-700"
                  >
                    {copiedCode === 'manifest' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === 'manifest' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>2. Konfigurasi HTTPS Scheme di capacitor.config.json</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Untuk mengatasi <strong>SecurityError</strong> yang disebabkan oleh skema WebView bukan HTTPS, pastikan <code>androidScheme: "https"</code> disetel pada konfigurasi Capacitor:
                </p>

                <div className="relative">
                  <pre className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-mono text-emerald-300 overflow-x-auto">
{`{
  "appId": "com.ateknisi.kasirservis",
  "appName": "Kasir Servis HP",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "cleartext": false
  }
}`}
                  </pre>
                  <button
                    onClick={() => handleCopy(`{\n  "appId": "com.ateknisi.kasirservis",\n  "appName": "Kasir Servis HP",\n  "webDir": "dist",\n  "server": {\n    "androidScheme": "https",\n    "cleartext": false\n  }\n}`, 'cap-cfg')}
                    className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] rounded text-slate-300 flex items-center gap-1 border border-slate-700"
                  >
                    {copiedCode === 'cap-cfg' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === 'cap-cfg' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-500/30 text-[11px] text-cyan-200">
                💡 <strong>Tips Terbaik:</strong> Di Android HP, Anda juga dapat membuka URL aplikasi langsung via browser <strong>Google Chrome Android</strong> (bukan aplikasi WebView pihak ketiga). Google Chrome di Android memiliki dukungan native Web Bluetooth 100% aktif!
              </div>
            </div>
          )}

          {/* TAB 2: Solusi NotFound & Printer 58mm */}
          {activeGuideTab === 'printer' && (
            <div className="space-y-3 text-xs text-slate-300 animate-in fade-in duration-150">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-white text-xs">
                  Langkah Mengatasi NotFoundError (Perangkat Tidak Ditemukan):
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
                  <li>
                    <strong>Nyalakan Printer & Cek Baterai:</strong> Pastikan tombol power printer thermal 58mm pada posisi ON dan lampu indikator biru/merah berkedip.
                  </li>
                  <li>
                    <strong>Putuskan dari HP Lain:</strong> Printer thermal POS mini umumnya hanya bisa terkoneksi ke 1 perangkat pada satu waktu. Jika sedang terhubung ke HP kasir lain, putuskan terlebih dahulu.
                  </li>
                  <li>
                    <strong>Aktifkan Bluetooth & Lokasi (GPS) di HP:</strong> Di Android, Bluetooth scanning memerlukan layanan Lokasi aktif.
                  </li>
                  <li>
                    <strong>Pasangkan (Pairing) di Pengaturan Bluetooth HP:</strong>
                    Buka Pengaturan HP &gt; Bluetooth &gt; Cari Perangkat &gt; Hubungkan ke nama printer Anda (misal: <code>RPP02N</code>, <code>MPT-II</code>, <code>POS-58</code>, <code>GOOJPRT</code>). Masukkan PIN standar: <code>0000</code> atau <code>1234</code>.
                  </li>
                </ol>
              </div>

              <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-500/30 text-[11px] text-amber-200 space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Daftar Nama Printer Thermal 58mm yang Didukung:</span>
                </div>
                <p className="text-slate-300">
                  Aplikasi telah dikonfigurasi dengan UUID standar untuk berbagai printer: Goojprt PT-210, Panda PRJ-58, Rongta RPP02N, VSC MP-58A, MPT-II, Iware, Zywell, Bluetooth Mini EDC, dan printer Bluetooth POS 58mm/80mm lainnya.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Solusi PC & Spooler */}
          {activeGuideTab === 'pc' && (
            <div className="space-y-3 text-xs text-slate-300 animate-in fade-in duration-150">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-white text-xs">
                  Solusi Printer di Komputer / Laptop (Windows PC):
                </div>
                <p className="text-[11px] text-slate-400">
                  Untuk PC, opsi terbaik dan paling stabil adalah:
                </p>

                <div className="space-y-2 pt-1">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 space-y-1">
                    <span className="font-bold text-emerald-400 text-xs">Opsi 1: Cetak Struk 58mm (Sistem / Driver Windows)</span>
                    <p className="text-[11px] text-slate-300">
                      Pasang driver printer thermal USB Anda di Windows (misal: POS-58 Driver). Di aplikasi, klik tombol <strong>"Cetak Struk 58mm (Sistem)"</strong>. Dialog Windows akan otomatis memformat lebar kertas pas 58mm tanpa margin.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 space-y-1">
                    <span className="font-bold text-cyan-400 text-xs">Opsi 2: Web Serial / Virtual COM (Kabel USB)</span>
                    <p className="text-[11px] text-slate-300">
                      Jika printer thermal dihubungkan via kabel USB, klik tombol <strong>"Serial/COM"</strong> di modal nota. Google Chrome di PC dapat langsung menulis byte ESC/POS ke port USB tanpa hambatan Bluetooth.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition"
          >
            Tutup Diagnostik
          </button>
        </div>

      </div>
    </div>
  );
};
