import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Mic, Camera, Send } from 'lucide-react';
import { api } from '../../services/api';
import { openConfirmModal, openScanModal, closeScanModal, showToast } from '../../store/uiSlice';
import { fetchDashboard } from '../../store/financeSlice';
import { fetchPantry } from '../../store/pantrySlice';

export default function QuickInputBar() {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();

  const handleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      dispatch(showToast({ message: 'Tu navegador no soporta dictado por voz directo.', icon: '⚠️' }));
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.interimResults = false;
    setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
      setIsListening(false);
      submitText(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const submitText = async (inputText) => {
    const q = (inputText || text).trim();
    if (!q) return;

    setLoading(true);
    try {
      const res = await api.processText(q);
      setLoading(false);
      setText('');

      if (!res.ok) {
        dispatch(showToast({ message: res.message || 'Error procesando texto', icon: '❌' }));
        return;
      }

      if (res.tipo === 'gasto' || res.tipo === 'ingreso') {
        dispatch(openConfirmModal(res));
      } else if (res.tipo === 'inventario_update') {
        dispatch(showToast({ message: res.message, icon: '🥫' }));
        dispatch(fetchDashboard());
        dispatch(fetchPantry('activo'));
      } else {
        dispatch(showToast({ message: res.message || 'Entendido', icon: '💡' }));
      }
    } catch {
      setLoading(false);
      dispatch(showToast({ message: 'Error conectando con el servidor', icon: '❌' }));
    }
  };

  const handleCameraChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    dispatch(openScanModal(preview));

    try {
      const res = await api.scanReceipt(file);
      dispatch(closeScanModal());
      if (res.ok && res.datos_gasto) {
        dispatch(openConfirmModal({ tipo: 'gasto', datos_gasto: res.datos_gasto }));
      } else {
        dispatch(showToast({ message: res?.message || 'No se pudo leer la factura con claridad.', icon: '⚠️' }));
      }
    } catch {
      dispatch(closeScanModal());
      dispatch(showToast({ message: 'Error analizando recibo.', icon: '❌' }));
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-3 md:p-4 border border-slate-200 dark:border-[#1f293d] shadow-sm transition-colors">
      <div className="flex items-center space-x-2">
        <button
          onClick={handleVoice}
          className={`p-3 rounded-xl transition flex-shrink-0 ${
            isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
          }`}
          title="Dictar por voz"
        >
          <Mic className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitText()}
          placeholder="Escribe o dicta: 'Almuerzo 18k' o 'Sueldo 4.5m'..."
          className="flex-1 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-400"
        />

        <button
          onClick={() => fileInputRef.current.click()}
          className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition flex-shrink-0"
          title="Escanear Factura"
        >
          <Camera className="w-5 h-5" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleCameraChange}
        />

        <button
          onClick={() => submitText()}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 active:scale-95 transition flex-shrink-0 shadow-md shadow-emerald-500/20"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span className="hidden md:inline">Registrar</span>
              <Send className="w-4 h-4 md:hidden" />
            </>
          )}
        </button>
      </div>

      {isListening && (
        <div className="flex items-center space-x-2 text-xs text-emerald-400 mt-2 px-1 animate-pulse font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Escuchando... Di tu gasto o ingreso claramente.</span>
        </div>
      )}
    </div>
  );
}
