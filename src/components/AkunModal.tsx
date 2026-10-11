import React, { useState, useEffect } from 'react';
import { 
  User, 
  KeyRound, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Save, 
  FileJson, 
  Download, 
  ShieldCheck, 
  ShieldAlert,
  HelpCircle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Edit3,
  Cloud
} from 'lucide-react';
import { 
  updateUserAccountProfile, 
  defaultFirebaseConfig,
  hasAccountSecurityPassword,
  setAccountSecurityPassword
} from '../services/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onUserUpdated: (newUserId: string) => void;
  onOpenSyncModal?: () => void;
}

export const AkunModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUserId,
  onUserUpdated,
  onOpenSyncModal
}) => {
  const [newUserId, setNewUserId] = useState(currentUserId || '');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Security Authorization Password States (Buka Kunci / Hapus Data)
  const [hasSecPassword, setHasSecPassword] = useState(false);
  const [isEditingSec, setIsEditingSec] = useState(false);
  const [previousSecCode, setPreviousSecCode] = useState('');
  const [newSecPassword, setNewSecPassword] = useState('');
  const [confirmSecPassword, setConfirmSecPassword] = useState('');
  const [showSecCode, setShowSecCode] = useState(false);
  const [secLoading, setSecLoading] = useState(false);
  const [secErrorMsg, setSecErrorMsg] = useState<string | null>(null);
  const [secSuccessMsg, setSecSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewUserId(currentUserId || '');
      setNewEmail('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg(null);
      setSuccessMsg(null);

      // Check security password status
      const exists = hasAccountSecurityPassword(currentUserId);
      setHasSecPassword(exists);
      setIsEditingSec(!exists); // If not set yet, open creation form directly
      setPreviousSecCode('');
      setNewSecPassword('');
      setConfirmSecPassword('');
      setSecErrorMsg(null);
      setSecSuccessMsg(null);
    }
  }, [isOpen, currentUserId]);

  // JSON Config download helper
  const handleDownloadFirebaseJson = () => {
    const configData = {
      project_id: defaultFirebaseConfig.projectId,
      app_id: defaultFirebaseConfig.appId,
      api_key: defaultFirebaseConfig.apiKey,
      auth_domain: defaultFirebaseConfig.authDomain,
      storage_bucket: defaultFirebaseConfig.storageBucket,
      database_url: `https://${defaultFirebaseConfig.projectId}-default-rtdb.firebaseio.com`,
      client: [
        {
          client_info: {
            mobilesdk_app_id: defaultFirebaseConfig.appId,
            android_client_info: {
              package_name: "com.ateknisi.kasirservis"
            }
          }
        }
      ]
    };

    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'google-services.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  // Handle User ID & Account Profile update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanId = newUserId.trim();
    if (!cleanId || cleanId.length < 3) {
      setErrorMsg('User ID minimal 3 karakter (huruf, angka, atau underscore).');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak sesuai dengan password baru.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateUserAccountProfile(
        currentUserId, 
        cleanId, 
        newPassword ? newPassword : undefined, 
        newEmail ? newEmail : undefined
      );

      setLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal memperbarui profil akun.');
      } else {
        setSuccessMsg(`Profil akun berhasil diperbarui! User ID Anda sekarang: "${res.finalUserId}"`);
        onUserUpdated(res.finalUserId);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem saat memperbarui akun.');
    }
  };

  // Handle Security Password Save/Update
  const handleSaveSecurityPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecErrorMsg(null);
    setSecSuccessMsg(null);

    const cleanNew = newSecPassword.trim();
    if (!cleanNew || cleanNew.length < 3) {
      setSecErrorMsg('Password keamanan minimal 3 karakter.');
      return;
    }

    if (cleanNew !== confirmSecPassword.trim()) {
      setSecErrorMsg('Konfirmasi password tidak sesuai dengan password baru.');
      return;
    }

    // Jika sudah pernah diset sebelumnya, wajib memasukkan kode sebelumnya!
    if (hasSecPassword && !previousSecCode.trim()) {
      setSecErrorMsg('Wajib memasukkan kode keamanan sebelumnya untuk melakukan perubahan.');
      return;
    }

    setSecLoading(true);
    try {
      const res = await setAccountSecurityPassword(
        currentUserId,
        cleanNew,
        hasSecPassword ? previousSecCode : undefined
      );
      setSecLoading(false);

      if (!res.success) {
        setSecErrorMsg(res.error || 'Gagal menyimpan password keamanan.');
      } else {
        setHasSecPassword(true);
        setIsEditingSec(false);
        setPreviousSecCode('');
        setNewSecPassword('');
        setConfirmSecPassword('');
        setSecSuccessMsg(
          hasSecPassword
            ? 'Password keamanan otorisasi berhasil diperbarui!'
            : 'Password keamanan berhasil dibuat! Fitur buka kunci & proteksi hapus kini aktif.'
        );
      }
    } catch (err: any) {
      setSecLoading(false);
      setSecErrorMsg(err?.message || 'Gagal memperbarui password keamanan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-5 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-bold text-sm text-cyan-400">
            <User className="w-4 h-4" />
            <span>Pengaturan Akun & User ID</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Current Account Card */}
        <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl mb-4 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Akun Aktif Saat Ini</span>
          <div className="flex items-center justify-between">
            <span className="text-base font-extrabold text-white">{currentUserId}</span>
            <span className="px-2 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full font-semibold">
              Terverifikasi
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block pt-1">
            Database Cloud: <code className="text-slate-400 font-mono text-[10px]">{defaultFirebaseConfig.projectId}</code>
          </span>

          {/* Sync PC ⇄ HP Info & Trigger Button */}
          <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sinkron PC ⇄ HP Aktif</span>
            </span>
            {onOpenSyncModal && (
              <button
                type="button"
                onClick={() => { onClose(); onOpenSyncModal(); }}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold transition"
              >
                Lihat Status & Sinkron
              </button>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* FITUR PASSWORD KEAMANAN OTORISASI (BUKA KUNCI / HAPUS DATA) */}
        {/* ============================================================ */}
        <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-600/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Password Otorisasi (Buka Kunci / Hapus)</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              hasSecPassword 
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              {hasSecPassword ? 'Terlindungi' : 'Belum Diatur'}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Password keamanan ini wajib dimasukkan saat <strong>membuka kunci mode edit</strong> atau <strong>menghapus data sensitif</strong> (nota servis, kas, stok sparepart, dan laporan).
          </p>

          {secErrorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{secErrorMsg}</span>
            </div>
          )}

          {secSuccessMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{secSuccessMsg}</span>
            </div>
          )}

          {/* If already configured and not in edit mode */}
          {hasSecPassword && !isEditingSec ? (
            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Password keamanan aktif dan mengamankan aplikasi.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditingSec(true);
                  setSecErrorMsg(null);
                  setSecSuccessMsg(null);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Ubah Password</span>
              </button>
            </div>
          ) : (
            // Form to create (first time) or update (with previous code)
            <form onSubmit={handleSaveSecurityPassword} className="space-y-3 pt-1">
              {hasSecPassword ? (
                // Case: Mengubah password -> WAJIB menuliskan kode sebelumnya
                <div>
                  <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                    Kode Keamanan Sebelumnya (Lama) <span className="text-rose-400">*Wajib</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type={showSecCode ? 'text' : 'password'}
                      value={previousSecCode}
                      onChange={(e) => setPreviousSecCode(e.target.value)}
                      placeholder="Masukkan kode keamanan sebelumnya..."
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-9 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecCode(!showSecCode)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showSecCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Diperlukan untuk memverifikasi bahwa Anda adalah pemilik sah akun ini.
                  </span>
                </div>
              ) : (
                // Case: Pertama kali -> Otomatis membuat dan konfirmasi saja (tanpa kode lama)
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-amber-300">
                  ⚡ <strong>Pertama Kali Mengatur:</strong> Cukup buat password baru dan konfirmasi di bawah ini.
                </div>
              )}

              {/* Password Baru */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  {hasSecPassword ? 'Password Keamanan Baru' : 'Buat Password Keamanan'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type={showSecCode ? 'text' : 'password'}
                    value={newSecPassword}
                    onChange={(e) => setNewSecPassword(e.target.value)}
                    placeholder="Minimal 3 karakter..."
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-9 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                  {!hasSecPassword && (
                    <button
                      type="button"
                      onClick={() => setShowSecCode(!showSecCode)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showSecCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Konfirmasi Password Baru */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Konfirmasi Password Keamanan Baru
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type={showSecCode ? 'text' : 'password'}
                    value={confirmSecPassword}
                    onChange={(e) => setConfirmSecPassword(e.target.value)}
                    placeholder="Ketik ulang password baru..."
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                {hasSecPassword && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingSec(false);
                      setPreviousSecCode('');
                      setNewSecPassword('');
                      setConfirmSecPassword('');
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-medium transition"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  disabled={secLoading}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {secLoading 
                      ? 'Menyimpan...' 
                      : hasSecPassword 
                      ? 'Perbarui Password Keamanan' 
                      : 'Simpan & Aktifkan Password'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* User ID & Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="font-bold text-xs text-slate-300 flex items-center gap-1.5 pt-1 border-t border-slate-800">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pengaturan Akun & Login</span>
          </div>

          {/* Edit User ID */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Ganti User ID / Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="Masukkan User ID baru..."
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              User ID ini digunakan untuk login di Android (Capacitor/WebIntoApp) dan PC.
            </span>
          </div>

          {/* Edit Email */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Alamat Email Pemulihan (Opsional)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Edit Password */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Ganti Password Login Akun (Kosongkan jika tidak ingin diubah)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-10 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {newPassword && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Konfirmasi Password Login Baru
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan Akun'}</span>
          </button>
        </form>

        {/* Paket Lengkap Source Code (ZIP) & Ikon untuk Build APK Capacitor di PC */}
        <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Paket Lengkap ZIP & Ikon (Build APK Capacitor di PC)</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Siap Build
            </span>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-900 shrink-0 shadow">
                <img src="/icon.png" alt="Logo Ahmad Teknisi" className="w-full h-full object-cover" />
              </div>
              <div className="text-[11px] text-slate-300 leading-tight">
                <div className="font-bold text-white">Ikon Resmi: Ahmad Teknisi Services & Repair</div>
                <div className="text-slate-400 text-[10px] mt-0.5">
                  Sudah dipaketkan dalam resolusi 1024x1024, 512x512, dan folder mipmap Android siap pasang.
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              File ZIP mencakup seluruh source code terbaru, konfigurasi <code>capacitor.config.json</code>, aset logo, dan panduan step-by-step <code>PANDUAN_BUAT_APK_CAPACITOR.md</code> untuk membuat APK di Android Studio PC.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <a
                href="/api/download-zip"
                download="kasir-servis-hp-ahmad-teknisi.zip"
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-[11px] rounded-xl shadow transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Proyek (.ZIP)</span>
              </a>

              <a
                href="/icon.png"
                download="logo-ahmad-teknisi-hd.png"
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] rounded-xl border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Unduh Ikon Saja (PNG)</span>
              </a>
            </div>
          </div>
        </div>

        {/* WebIntoApp & Firebase Integration Explanation */}
        <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Integrasi Firebase & WebIntoApp (Opsi Cloud)</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            💡 <strong>Info WebIntoApp:</strong> Saat membuat APK di WebIntoApp via URL web, Firebase sudah otomatis tersambung 100%. Namun jika form WebIntoApp Anda memerlukan berkas JSON konfigurasi, silakan unduh di bawah:
          </p>

          <button
            type="button"
            onClick={handleDownloadFirebaseJson}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] rounded-xl border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Unduh Berkas google-services.json (Opsional)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
