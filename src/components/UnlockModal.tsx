import React, { useState, useEffect } from 'react';
import { Lock, Unlock, X, KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { 
  hasAccountSecurityPassword, 
  verifyAccountSecurityPassword,
  setAccountSecurityPassword 
} from '../services/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onUnlockSuccess: () => void;
}

export const UnlockModal: React.FC<Props> = ({
  isOpen,
  onClose,
  userId,
  onUnlockSuccess
}) => {
  const [hasPassword, setHasPassword] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  
  // States for first-time creation
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const exists = hasAccountSecurityPassword(userId);
      setHasPassword(exists);
      setInputPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setErrorMsg(null);
      setSuccessMsg(null);
      setLoading(false);
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  // Handle unlock when password already exists
  const handleVerifyUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!inputPassword.trim()) {
      setErrorMsg('Masukkan password keamanan akun Anda.');
      return;
    }

    const isValid = verifyAccountSecurityPassword(inputPassword, userId);
    if (!isValid) {
      setErrorMsg('Password keamanan salah! Akses buka kunci ditolak.');
      return;
    }

    setSuccessMsg('Kunci berhasil dibuka! Akses hapus dan edit aktif.');
    setTimeout(() => {
      onUnlockSuccess();
      onClose();
    }, 600);
  };

  // Handle first-time password creation & unlock
  const handleFirstTimeCreateAndUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanNew = newPassword.trim();
    if (!cleanNew || cleanNew.length < 3) {
      setErrorMsg('Password keamanan minimal 3 karakter.');
      return;
    }

    if (cleanNew !== confirmPassword.trim()) {
      setErrorMsg('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    setLoading(true);
    try {
      const res = await setAccountSecurityPassword(userId, cleanNew);
      setLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal menyimpan password keamanan.');
      } else {
        setSuccessMsg('Password keamanan berhasil dibuat! Kunci akses otomatis terbuka.');
        setTimeout(() => {
          onUnlockSuccess();
          onClose();
        }, 700);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl text-slate-100 animate-in zoom-in-95 duration-150 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-400">
            <Unlock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Buka Kunci Mode Hapus / Edit</h3>
            <span className="text-[11px] text-slate-400">Otorisasi Hak Akses</span>
          </div>
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

        {hasPassword ? (
          // Case 1: Password already exists -> Enter code to unlock
          <form onSubmit={handleVerifyUnlock} className="space-y-3.5">
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              Fitur hapus dan edit data diproteksi. Masukkan password keamanan Anda untuk membuka kunci akses.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Password Keamanan / Kode Otorisasi
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={inputPassword}
                  onChange={(e) => {
                    setInputPassword(e.target.value);
                    setErrorMsg(null);
                  }}
                  autoFocus
                  placeholder="Masukkan password keamanan..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-9 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Buka Kunci</span>
              </button>
            </div>
          </form>
        ) : (
          // Case 2: First-time setup -> Automatically create & confirm only
          <form onSubmit={handleFirstTimeCreateAndUnlock} className="space-y-3">
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/30 text-amber-200 text-[11px] space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <ShieldCheck className="w-4 h-4" />
                <span>Pengaturan Pertama Kali</span>
              </div>
              <p className="text-slate-300 leading-normal">
                Akun Anda belum memiliki password keamanan. Buat password sekarang untuk membuka kunci dan mengamankan tindakan hapus data.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Buat Password Keamanan Baru
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrorMsg(null);
                  }}
                  autoFocus
                  placeholder="Minimal 3 karakter..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-9 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Konfirmasi Password Keamanan
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Ketik ulang password baru..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{loading ? 'Menyimpan...' : 'Buat & Buka Kunci'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
