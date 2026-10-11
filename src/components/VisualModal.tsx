import React, { useState } from 'react';
import { Palette, Check, X, Sparkles } from 'lucide-react';
import { PengaturanVisual } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  visual: PengaturanVisual;
  onSaveVisual: (v: PengaturanVisual) => void;
}

export const VisualModal: React.FC<Props> = ({ isOpen, onClose, visual, onSaveVisual }) => {
  const [c1, setC1] = useState(visual.c1);
  const [c2, setC2] = useState(visual.c2);
  const [dir, setDir] = useState(visual.dir);
  const [op, setOp] = useState(visual.op);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveVisual({ c1, c2, dir, op });
    onClose();
  };

  const handleResetDefault = () => {
    setC1('#0a1128');
    setC2('#1e3a8a');
    setDir('135deg');
    setOp(94);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-bold text-sm text-cyan-400">
            <Palette className="w-4 h-4" />
            <span>Kustomisasi Background & Warna</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Warna Awal (RGB)
              </label>
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <input
                  type="color"
                  value={c1}
                  onChange={(e) => setC1(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="font-mono text-xs">{c1}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Warna Gradasi (RGB)
              </label>
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <input
                  type="color"
                  value={c2}
                  onChange={(e) => setC2(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="font-mono text-xs">{c2}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Arah Gradasi Warna
            </label>
            <select
              value={dir}
              onChange={(e) => setDir(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="to bottom">Atas ke Bawah</option>
              <option value="to right">Kiri ke Kanan</option>
              <option value="135deg">Diagonal (135°)</option>
              <option value="circle">Melingkar (Radial)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-slate-400">
                Transparansi Card / Box Konten:
              </label>
              <span className="font-bold text-xs text-cyan-400">{op}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={op}
              onChange={(e) => setOp(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Mini Preview Box */}
          <div 
            className="p-3 rounded-xl border border-slate-700 text-center text-xs font-semibold text-white shadow-inner"
            style={{
              background: dir === 'circle' ? `radial-gradient(circle, ${c1}, ${c2})` : `linear-gradient(${dir}, ${c1}, ${c2})`
            }}
          >
            <div 
              className="p-3 rounded-lg text-slate-900 font-bold"
              style={{ backgroundColor: `rgba(255, 255, 255, ${op / 100})` }}
            >
              Contoh Kartu Kasir ({op}%)
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Tampilan Visual</span>
            </button>
            <button
              onClick={handleResetDefault}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-medium text-xs rounded-xl transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Kembalikan ke Default Sirkuit Teknisi</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
