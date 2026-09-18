import React from 'react';
import { useSelector } from 'react-redux';
import { ScanLine } from 'lucide-react';

export default function ScanReceiptModal() {
  const { isOpen, previewUrl } = useSelector((state) => state.ui.scanModal);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 glass flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
        <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mx-auto border border-purple-500/30">
          <ScanLine className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-base">Analizando Factura</h3>
        <div className="relative w-full h-48 bg-[#0b0f19] rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
          {previewUrl && <img src={previewUrl} alt="Factura" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center space-y-2 text-xs text-purple-400 font-medium">
            <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <span>Extrayendo productos con Gemini Vision...</span>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Gemini está reconociendo el comercio, total y los productos para tu despensa.
        </p>
      </div>
    </div>
  );
}
