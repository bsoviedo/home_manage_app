import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Plus, RotateCcw, Wallet, X, Check, ArrowRight } from 'lucide-react';
import { openConfirmModal, showToast } from '../../store/uiSlice';
import { fetchDashboard, fetchInitialFinanceData } from '../../store/financeSlice';
import { api } from '../../services/api';

export default function FundsPills({ funds = [], resumen = {} }) {
  const dispatch = useDispatch();
  const r = resumen || {};
  const fondosCalculados = r.fondos_calculados || [];
  const formatCOP = (val) => '$' + Number(val || 0).toLocaleString('es-CO') + ' COP';

  // State for cycle reset modal
  const [resetModalFund, setResetModalFund] = useState(null);
  const [startingAmount, setStartingAmount] = useState('450000');
  const [resetNote, setResetNote] = useState('');
  const [savingReset, setSavingReset] = useState(false);

  const handleOpenIncome = (fundId = 'personal') => {
    dispatch(
      openConfirmModal({
        tipo: 'ingreso',
        datos_ingreso: {
          monto: 0,
          concepto: '',
          fondo_destino: fundId,
          fecha: new Date().toISOString().substring(0, 10),
        },
      })
    );
  };

  const handleOpenResetModal = (fund) => {
    setResetModalFund(fund);
    setStartingAmount(fund.id === 'conjunto' ? '450000' : '0');
    setResetNote('');
  };

  const handleExecuteReset = async (e) => {
    e.preventDefault();
    if (!resetModalFund) return;

    setSavingReset(true);
    try {
      const amt = Number(startingAmount) || 0;
      const res = await api.resetFundCycle(resetModalFund.id, {
        monto_inicial: amt,
        nota: resetNote || `Inicio de ciclo de ${resetModalFund.nombre}`,
      });

      setSavingReset(false);
      if (res.ok) {
        dispatch(
          showToast({
            message: `¡Ciclo de ${resetModalFund.nombre} reiniciado con ${formatCOP(amt)}!`,
            icon: '🔄',
          })
        );
        setResetModalFund(null);
        dispatch(fetchDashboard());
        dispatch(fetchInitialFinanceData());
      } else {
        dispatch(showToast({ message: 'Error al reiniciar ciclo.', icon: '❌' }));
      }
    } catch {
      setSavingReset(false);
      dispatch(showToast({ message: 'Error de conexión con el servidor.', icon: '❌' }));
    }
  };

  return (
    <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-[#1f293d] shadow-sm transition-colors space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center space-x-1.5">
            <Wallet className="w-4 h-4 text-purple-400" />
            <span>Bolsillos — Balance y Ciclos Manuales</span>
          </h2>
          <p className="text-[10px] text-slate-400">
            Control exacto por bolsillo con reinicio de balance a voluntad
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleOpenIncome('personal')}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 font-semibold text-xs transition flex items-center space-x-1 border border-emerald-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Ingreso</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {funds.map((f) => {
          const calc = fondosCalculados.find((fc) => fc.id === f.id);
          const g = calc?.gastos_periodo !== undefined ? calc.gastos_periodo : ((r.por_fondo_gasto && r.por_fondo_gasto[f.id]) || 0);
          const i = calc?.ingresos_periodo !== undefined ? calc.ingresos_periodo : ((r.por_fondo_ingreso && r.por_fondo_ingreso[f.id]) || 0);
          const saldoDisp = calc?.saldo_actual !== undefined ? calc.saldo_actual : (i - g);
          const tieneCorte = calc?.tiene_corte;
          const fechaCorte = calc?.fecha_inicio_ciclo;

          return (
            <div
              key={f.id}
              className="p-4 bg-slate-50 dark:bg-[#0b0f19] rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 transition flex flex-col justify-between space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mr-1">
                  {f.nombre}
                </span>
                <button
                  onClick={() => handleOpenResetModal(f)}
                  className="text-[10px] px-2 py-0.8 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 font-semibold transition flex items-center space-x-1 shadow-sm"
                  title="Reiniciar balance de este bolsillo e iniciar nuevo ciclo"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reiniciar Ciclo</span>
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>Balance Disponible:</span>
                  {tieneCorte && (
                    <span className="text-[9px] text-purple-400 font-medium">
                      Ciclo desde {fechaCorte}
                    </span>
                  )}
                </div>
                <div
                  className={`text-base font-bold ${
                    saldoDisp >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500'
                  }`}
                >
                  {formatCOP(saldoDisp)}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span className="text-emerald-400 font-medium">📥 +{formatCOP(i).replace(' COP', '')}</span>
                <span className="text-rose-400 font-medium">💸 -{formatCOP(g).replace(' COP', '')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: MANUAL CYCLE RESET */}
      {resetModalFund && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <button
              onClick={() => setResetModalFund(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center border border-purple-500/20">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Reiniciar Ciclo — {resetModalFund.nombre}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Cierra el ciclo anterior y arranca un balance fresco
                </p>
              </div>
            </div>

            <form onSubmit={handleExecuteReset} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  ¿Con cuánto dinero arranca este nuevo ciclo? (COP)
                </label>
                <input
                  type="number"
                  value={startingAmount}
                  onChange={(e) => setStartingAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-400"
                  required
                />

                {/* Quick preset buttons */}
                <div className="flex items-center space-x-1.5 mt-2 flex-wrap gap-y-1">
                  {[0, 100000, 200000, 450000, 1000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setStartingAmount(String(amt))}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-purple-500/10 hover:text-purple-400 transition text-[10px] font-semibold"
                    >
                      {amt === 0 ? '$0' : `+${formatCOP(amt).replace(' COP', '')}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Nota del Inicio de Ciclo (Opcional)
                </label>
                <input
                  type="text"
                  value={resetNote}
                  onChange={(e) => setResetNote(e.target.value)}
                  placeholder="Ej. Aporte de Cami quincena 26-Sep / Sueldo Octubre"
                  className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-[11px] text-slate-300 space-y-1">
                <span className="font-bold text-purple-400 flex items-center space-x-1">
                  <span>💡 ¿Qué pasará al reiniciar?</span>
                </span>
                <p className="text-slate-400 leading-relaxed text-[10px]">
                  Todos tus gastos y compras anteriores siguen guardados intactos en el historial. A partir de este momento, el balance de este bolsillo arrancará limpio con <strong>{formatCOP(startingAmount)}</strong> y solo descontará las compras nuevas de este ciclo.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalFund(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingReset}
                  className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold transition shadow-lg shadow-purple-500/20 flex items-center justify-center space-x-1.5"
                >
                  {savingReset ? <span>Guardando...</span> : <><span>Iniciar Ciclo</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
