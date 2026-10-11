import React, { useState } from 'react';
import { Calculator, X, Delete } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const KalkulatorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');

  if (!isOpen) return null;

  const handleInput = (val: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(val);
    } else {
      setDisplay(display + val);
    }
  };

  const handleClear = () => {
    setDisplay('0');
  };

  const handleBackspace = () => {
    if (display.length <= 1 || display === 'Error') {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleEqual = () => {
    try {
      // safe eval using standard Math expression
      const sanitized = display.replace(/[^0-9+\-*/.]/g, '');
      // eslint-disable-next-line no-eval
      const result = Function(`'use strict'; return (${sanitized})`)();
      setDisplay(String(result));
    } catch {
      setDisplay('Error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xs rounded-2xl p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-cyan-400">
            <Calculator className="w-4 h-4" />
            <span>Kalkulator Cepat Konter</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display Screen */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-right font-mono text-2xl font-bold text-cyan-300 overflow-x-auto select-all mb-4">
          {display}
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-4 gap-2 text-sm font-bold">
          <button onClick={handleClear} className="p-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50">C</button>
          <button onClick={handleBackspace} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"><Delete className="w-4 h-4" /></button>
          <button onClick={() => handleInput('/')} className="p-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/40">÷</button>
          <button onClick={() => handleInput('*')} className="p-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/40">×</button>

          <button onClick={() => handleInput('7')} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">7</button>
          <button onClick={() => handleInput('8')} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">8</button>
          <button onClick={() => handleInput('9')} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">9</button>
          <button onClick={() => handleInput('-')} className="p-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/40">-</button>

          <button onClick={() => handleInput('4')} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">4</button>
          <button onClick={() => handleInput('5')} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">5</button>
          <button onClick={() => handleInput('6')} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">6</button>
          <button onClick={() => handleInput('+')} className="p-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/40">+</button>

          <button onClick={() => handleInput('1')} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">1</button>
          <button onClick={() => handleInput('2')} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">2</button>
          <button onClick={() => handleInput('3')} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">3</button>
          <button onClick={() => handleInput('00')} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">00</button>

          <button onClick={() => handleInput('0')} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">0</button>
          <button onClick={() => handleInput('.')} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">.</button>
          <button onClick={handleEqual} className="p-3 col-span-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold shadow-lg shadow-cyan-900/40">=</button>
        </div>

      </div>
    </div>
  );
};
