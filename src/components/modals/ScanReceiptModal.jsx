import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ScanLine, X } from 'lucide-react';
import { closeScanModal } from '../../store/uiSlice';

export default function ScanReceiptModal() {
  const dispatch = useDispatch();
  const { isOpen, previewUrl } = useSelector((state) => state.ui.scanModal);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 glass flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center relative">
        <button
          onClick={() => dispatch(closeScanModal())}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-800/40 transition"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
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
