import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  Mail, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  LogIn, 
  RefreshCw,
  Eye,
  EyeOff,
  HelpCircle,
  ArrowLeft,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { 
  registerUserAccount, 
  loginUserAccount, 
  requestPasswordReset, 
  resetUserPassword,
  getRecentLoggedInAccounts 
} from '../services/firebase';

interface Props {
  isOpen: boolean;
  onSuccess: (userIdOrEmail: string, uid?: string) => void;
}

export const LoginModal: React.FC<Props> = ({ isOpen, onSuccess }) => {
  // Mode: 'login' | 'register' | 'forgot'
  const [modalMode, setModalMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Common loading & alerts
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Recent logged-in accounts
  const [recentAccounts, setRecentAccounts] = useState<any[]>([]);
  const [selectedQuickUser, setSelectedQuickUser] = useState<string | null>(null);

  // Login form fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form fields
  const [regUserId, setRegUserId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSecurityPassword, setRegSecurityPassword] = useState('');
  const [regConfirmSecurityPassword, setRegConfirmSecurityPassword] = useState('');

  // Forgot password form fields
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      const list = getRecentLoggedInAccounts();
      setRecentAccounts(list);
      const lastUser = localStorage.getItem('last_active_user') || localStorage.getItem('userAccount');
      if (lastUser) {
        setSelectedQuickUser(lastUser);
        setLoginIdentifier(lastUser);
      } else if (list.length > 0) {
        setSelectedQuickUser(list[list.length - 1].userId);
        setLoginIdentifier(list[list.length - 1].userId);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanId = loginIdentifier.trim();
    if (!cleanId) {
      setErrorMsg('Masukkan User ID atau Alamat Email Anda.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Masukkan Password akun Anda.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginUserAccount(cleanId, loginPassword);
      setLoading(false);

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        const displayName = res.userId || res.email || cleanId;
        localStorage.setItem('last_active_user', displayName);
        setSuccessMsg(`Login berhasil! Selamat datang, ${displayName}.`);
        setTimeout(() => {
          onSuccess(displayName, res.user?.uid || res.uid);
        }, 500);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'Gagal login. Periksa kembali User ID dan Password Anda.');
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUserId = regUserId.trim();
    const cleanEmail = regEmail.trim();

    if (!cleanUserId || cleanUserId.length < 3) {
      setErrorMsg('User ID minimal 3 karakter (contoh: a_teknisi).');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Format email pendaftaran tidak valid.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('Password login minimal 6 karakter.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok dengan password yang dibuat.');
      return;
    }

    if (regSecurityPassword) {
      if (regSecurityPassword.trim().length < 3) {
        setErrorMsg('Password keamanan otorisasi minimal 3 karakter.');
        return;
      }
      if (regSecurityPassword.trim() !== regConfirmSecurityPassword.trim()) {
        setErrorMsg('Konfirmasi password keamanan tidak cocok.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await registerUserAccount(
        cleanUserId, 
        cleanEmail, 
        regPassword, 
        regSecurityPassword ? regSecurityPassword.trim() : undefined
      );
      setLoading(false);

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        const displayName = res.userId || cleanUserId;
        localStorage.setItem('last_active_user', displayName);
        setSuccessMsg(`Pendaftaran berhasil! Akun "${displayName}" telah aktif.`);
        setTimeout(() => {
          onSuccess(displayName, res.user?.uid || res.uid);
        }, 700);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'Gagal mendaftarkan akun. Silakan periksa formulir.');
    }
  };

  // Handle Request Password Reset Code
  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanId = forgotIdentifier.trim();
    if (!cleanId) {
      setErrorMsg('Masukkan User ID atau Email akun Anda.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(cleanId);
      setLoading(false);

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal memproses pemulihan akun.');
      } else {
        setRecoverySent(true);
        setRecoveryEmail(res.email || cleanId);
        if (res.code) {
          setRecoveryCode(res.code);
        }
        setSuccessMsg(res.message || 'Kode verifikasi pemulihan berhasil dibuat.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'Terjadi kesalahan saat meminta kode pemulihan.');
    }
  };

  // Handle Complete Password Reset
  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!recoveryCode.trim()) {
      setErrorMsg('Masukkan kode pemulihan akun.');
      return;
    }
    if (!recoveryNewPassword || recoveryNewPassword.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetUserPassword(recoveryEmail, recoveryCode, recoveryNewPassword);
      setLoading(false);

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal mereset password.');
      } else {
        setSuccessMsg('Password berhasil direset! Silakan login dengan password baru.');
        setTimeout(() => {
          setModalMode('login');
          setRecoverySent(false);
          setLoginPassword(recoveryNewPassword);
          setSuccessMsg('Password baru telah diterapkan. Klik Masuk.');
        }, 1200);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'Terjadi kesalahan saat menyimpan password baru.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 sm:p-7 shadow-2xl text-slate-100 text-center relative animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto">
        
        {/* Brand Icon */}
        <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25 text-2xl font-black text-white">
          A
        </div>

        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          A Teknisi
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Sistem Kasir, Servis HP, Jual Beli & Rekap Kas
        </p>

        {/* Tab Selector: Masuk vs Daftar (Only if not in forgot mode) */}
        {modalMode !== 'forgot' ? (
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 mt-5 mb-4">
            <button
              type="button"
              onClick={() => { setModalMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                modalMode === 'login'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk (Login)</span>
            </button>

            <button
              type="button"
              onClick={() => { setModalMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                modalMode === 'register'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Akun Baru</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-4 mb-4 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => { setModalMode('login'); setRecoverySent(false); setErrorMsg(null); setSuccessMsg(null); }}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Login</span>
            </button>
            <span className="text-xs font-bold text-slate-400">Pemulihan Password</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-left flex items-start gap-2 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-left flex items-start gap-2 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div>{successMsg}</div>
          </div>
        )}

        {/* ----------------- MODE 1: LOGIN ----------------- */}
        {modalMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-left">
            
            {/* Quick Session Resume Selector */}
            {selectedQuickUser && (
              <div className="p-3 bg-cyan-950/40 border border-cyan-800/50 rounded-xl space-y-1.5 mb-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-cyan-300 font-bold flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    Sesi Akun Terakhir:
                  </span>
                  <button
                    type="button"
                    onClick={() => { setSelectedQuickUser(null); setLoginIdentifier(''); }}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    Ganti User ID Lain
                  </button>
                </div>
                <div className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                  <span className="font-extrabold text-xs text-white">{selectedQuickUser}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Tersimpan di HP/PC</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                User ID / Alamat Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Ketik User ID atau Email..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setModalMode('forgot'); setErrorMsg(null); setSuccessMsg(null); }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline font-semibold"
                >
                  Lupa Password / User ID?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan password akun..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Aplikasi</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ----------------- MODE 2: REGISTER ----------------- */}
        {modalMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-left">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                User ID Pilihan Anda <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={regUserId}
                  onChange={(e) => setRegUserId(e.target.value)}
                  placeholder="Contoh: a_teknisi (huruf & angka)"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Alamat Email Aktif <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Contoh: nama@gmail.com"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 karakter"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-8 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Konfirmasi Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Password Keamanan Otorisasi (Buka Kunci / Hapus Data) */}
            <div className="pt-2.5 pb-1 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Password Otorisasi (Buka Kunci & Hapus)</span>
                </div>
                <span className="text-[10px] text-amber-400/90 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Proteksi Data
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Digunakan untuk membuka kunci mode edit dan konfirmasi saat menghapus nota, kas, stok, atau laporan.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                    Buat Kode Keamanan
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={regSecurityPassword}
                      onChange={(e) => setRegSecurityPassword(e.target.value)}
                      placeholder="Min 3 karakter..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-8 pr-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                    Konfirmasi Kode
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={regConfirmSecurityPassword}
                      onChange={(e) => setRegConfirmSecurityPassword(e.target.value)}
                      placeholder="Ketik ulang..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-8 pr-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mendaftarkan Akun...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar Akun Baru</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ----------------- MODE 3: FORGOT PASSWORD ----------------- */}
        {modalMode === 'forgot' && (
          <div className="space-y-3.5 text-left">
            {!recoverySent ? (
              <form onSubmit={handleRequestRecovery} className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Masukkan <strong>User ID</strong> atau <strong>Email</strong> yang Anda gunakan saat mendaftar. Sistem akan menyiapkan kode verifikasi pemulihan untuk reset password.
                </p>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    User ID atau Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="Ketik User ID atau Email..."
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  <span>Kirim Kode Pemulihan</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleCompleteReset} className="space-y-3">
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 space-y-1">
                  <span className="text-slate-400 block">Akun / Email Terdeteksi:</span>
                  <span className="font-bold text-cyan-400">{recoveryEmail}</span>
                  {recoveryCode && (
                    <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-emerald-400">
                      Kode Pemulihan Anda: <strong>{recoveryCode}</strong>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Kode Pemulihan 6-Digit
                  </label>
                  <input
                    type="text"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    placeholder="Masukkan 6 digit kode..."
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-mono tracking-widest text-center focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Buat Password Baru (Min 6 Karakter)
                  </label>
                  <input
                    type="password"
                    value={recoveryNewPassword}
                    onChange={(e) => setRecoveryNewPassword(e.target.value)}
                    placeholder="Password baru..."
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>Simpan & Terapkan Password Baru</span>
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
