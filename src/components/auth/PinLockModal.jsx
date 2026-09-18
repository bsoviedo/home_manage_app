import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Lock, Delete } from 'lucide-react';
import { verifyPin, clearError } from '../../store/authSlice';

export default function PinLockModal() {
  const [pin, setPin] = useState('');
  const dispatch = useDispatch();
  const { error, loading } = useSelector((state) => state.auth);

  const handlePress = (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        dispatch(verifyPin(nextPin));
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    dispatch(clearError());
  };

  const handleClear = () => {
    setPin('');
    dispatch(clearError());
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0f19] flex flex-col items-center justify-center p-6 text-slate-100">
      <div className="text-center max-w-xs w-full">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-1">Acceso Privado</h2>
        <p className="text-xs text-slate-400 mb-6">Ingresa tu PIN de 4 dígitos para desbloquear tu app</p>

        {/* PIN Dots */}
        <div className="flex justify-center space-x-4 mb-8">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                idx <= pin.length
                  ? 'bg-emerald-400 border-emerald-400 scale-110'
                  : 'border-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3.5 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handlePress(num)}
              disabled={loading}
              className="h-14 rounded-2xl bg-[#131b2e] active:bg-emerald-600 border border-slate-800 text-xl font-semibold transition"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-14 rounded-2xl bg-[#131b2e] active:bg-red-600 border border-slate-800 text-xs font-semibold text-slate-400 transition"
          >
            C
          </button>
          <button
            onClick={() => handlePress('0')}
            disabled={loading}
            className="h-14 rounded-2xl bg-[#131b2e] active:bg-emerald-600 border border-slate-800 text-xl font-semibold transition"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-[#131b2e] active:bg-slate-700 border border-slate-800 text-slate-400 transition flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {error && <p className="text-xs text-rose-500 mt-4 font-medium">{error}</p>}
      </div>
    </div>
  );
}
