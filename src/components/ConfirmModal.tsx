import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, CheckCircle2, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { 
  hasAccountSecurityPassword, 
  verifyAccountSecurityPassword 
} from '../services/firebase';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  requirePassword?: boolean;
  userId?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<Props> = ({
  isOpen,
  title,
  message,
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  variant = 'danger',
  requirePassword = false,
  userId,
  onConfirm,
  onCancel
}) => {
  const [securityInput, setSecurityInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Check if account has security password configured
  const isProtected = hasAccountSecurityPassword(userId);
  const isDanger = variant === 'danger';
  const needPasswordCheck = (requirePassword || isDanger) && isProtected;

  useEffect(() => {
    if (isOpen) {
      setSecurityInput('');
      setShowPassword(false);
      setPasswordError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleActionConfirm = () => {
    setPasswordError(null);

    if (needPasswordCheck) {
      if (!securityInput.trim()) {
        setPasswordError('Wajib memasukkan password keamanan untuk konfirmasi hapus.');
        return;
      }

      const isValid = verifyAccountSecurityPassword(securityInput, userId);
      if (!isValid) {
        setPasswordError('Password keamanan salah! Tindakan hapus dibatalkan.');
        return;
      }
    }

    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl text-slate-100 animate-in zoom-in-95 duration-150 relative">
        
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2.5 rounded-xl border ${
            isDanger 
              ? 'bg-rose-950/60 border-rose-500/40 text-rose-400' 
              : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
          }`}>
            {isDanger ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">{title}</h3>
            <span className="text-[11px] text-slate-400">
              {needPasswordCheck ? 'Otorisasi Password Keamanan' : 'Konfirmasi Tindakan'}
            </span>
          </div>
        </div>

        {/* Message */}
        <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
          {message}
        </p>

        {/* Password Security Verification Field if Protected */}
        {needPasswordCheck ? (
          <div className="mb-4 p-3 bg-slate-950/80 rounded-xl border border-rose-900/40 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Otorisasi Hapus: Masukkan Password Keamanan</span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={securityInput}
                onChange={(e) => {
                  setSecurityInput(e.target.value);
                  setPasswordError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleActionConfirm();
                  }
                }}
                autoFocus
                placeholder="Ketik password keamanan Anda..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-3 pr-9 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError ? (
              <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{passwordError}</span>
              </p>
            ) : (
              <p className="text-[10px] text-slate-500">
                Hanya pemilik akun dengan password yang diatur di Pengaturan Akun yang dapat menghapus data ini.
              </p>
            )}
          </div>
        ) : (
          !isProtected && isDanger && (
            <div className="mb-4 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>Tips: Pasang <strong>Password Keamanan</strong> di menu Pengaturan Akun & User ID untuk mengunci fitur hapus dari sembarang orang.</span>
            </div>
          )
        )}

        {/* Action Buttons */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleActionConfirm}
            className={`flex-1 py-2 px-3 font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5 ${
              isDanger 
                ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            {isDanger ? <Trash2 className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{confirmText}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
