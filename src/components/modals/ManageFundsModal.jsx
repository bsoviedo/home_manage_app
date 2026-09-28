import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Zap, Sliders, Wallet, ArrowUpRight, Check, Plus } from 'lucide-react';
import { closeFundsModal, showToast } from '../../store/uiSlice';
import { fetchDashboard, fetchInitialFinanceData } from '../../store/financeSlice';
import { api } from '../../services/api';

export default function ManageFundsModal() {
  const dispatch = useDispatch();
  const { isOpen, activeTab: initialTab, selectedFundId } = useSelector((state) => state.ui.fundsModal);
  const { funds, dashboard } = useSelector((state) => state.finance);

  const [activeTab, setActiveTab] = useState('recharge');
  const [targetFundId, setTargetFundId] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeNote, setRechargeNote] = useState('');
  const [baselines, setBaselines] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'recharge');
      setTargetFundId(selectedFundId || (funds[0]?.id || 'personal'));
      setRechargeAmount('');
      setRechargeNote('');

      // Populate baselines
      const map = {};
      funds.forEach((f) => {
        map[f.id] = f.saldo_inicial || 0;
      });
      setBaselines(map);
    }
  }, [isOpen, initialTab, selectedFundId, funds]);

  if (!isOpen) return null;

  const formatCOP = (val) => '$' + Number(val || 0).toLocaleString('es-CO') + ' COP';

  const handleQuickAdd = (amt) => {
    const current = Number(rechargeAmount) || 0;
    setRechargeAmount(String(current + amt));
  };

  const handleRechargeSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(rechargeAmount);
    if (!targetFundId || amt <= 0) {
      dispatch(showToast({ message: 'Ingresa un monto válido para recargar.', icon: '⚠️' }));
      return;
    }

    setSaving(true);
    try {
      const res = await api.rechargeFund(targetFundId, { monto: amt, nota: rechargeNote });
      setSaving(false);
      if (res.ok) {
        dispatch(showToast({ message: `¡Bolsillo recargado con éxito! +${formatCOP(amt)}`, icon: '⚡' }));
        dispatch(fetchInitialFinanceData());
        dispatch(fetchDashboard());
        dispatch(closeFundsModal());
      } else {
        dispatch(showToast({ message: 'Error al recargar el bolsillo.', icon: '❌' }));
      }
    } catch {
      setSaving(false);
      dispatch(showToast({ message: 'Error conectando con el servidor.', icon: '❌' }));
    }
  };

  const handleBaselineSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      for (const [fId, val] of Object.entries(baselines)) {
        await api.setFundBaseline(fId, val);
      }
      setSaving(false);
      dispatch(showToast({ message: '¡Líneas base actualizadas correctamente!', icon: '✅' }));
      dispatch(fetchInitialFinanceData());
      dispatch(fetchDashboard());
      dispatch(closeFundsModal());
    } catch {
      setSaving(false);
      dispatch(showToast({ message: 'Error guardando líneas base.', icon: '❌' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 max-w-md w-full shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => dispatch(closeFundsModal())}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Gestión de Bolsillos y Capital</h3>
            <p className="text-xs text-slate-400">Inyecta dinero o ajusta los saldos iniciales</p>
          </div>
        </div>

        {/* Tabs Switcher */}
        <div className="flex bg-slate-100 dark:bg-[#0b0f19] p-1 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('recharge')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'recharge'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ Recargar Bolsillo</span>
          </button>
          <button
            onClick={() => setActiveTab('baseline')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'baseline'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>⚙️ Línea Base Inicial</span>
          </button>
        </div>

        {/* TAB 1: RECHARGE POCKET */}
        {activeTab === 'recharge' && (
          <form onSubmit={handleRechargeSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">¿A qué bolsillo deseas inyectar capital?</label>
              <select
                value={targetFundId}
                onChange={(e) => setTargetFundId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {funds.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Monto de la Recarga (COP)</label>
              <input
                type="number"
                placeholder="Ej. 300000"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                required
              />

              {/* Quick Add Buttons */}
              <div className="flex items-center space-x-1.5 mt-2 flex-wrap gap-y-1">
                {[50000, 100000, 200000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAdd(amt)}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400 transition text-[10px] font-semibold"
                  >
                    +{formatCOP(amt).replace(' COP', '')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Nota / Origen (Opcional)</label>
              <input
                type="text"
                placeholder="Ej. Nómina quincena, Transferencia Nequi"
                value={rechargeNote}
                onChange={(e) => setRechargeNote(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[11px] text-emerald-400 space-y-1">
              <span className="font-bold flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5" />
                <span>¿Cómo funciona?</span>
              </span>
              <p className="text-slate-400 leading-relaxed">
                Inyectar dinero aumenta el saldo disponible de este bolsillo inmediatamente para que no tengas balances en rojo.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-1.5"
            >
              {saving ? <span>Procesando...</span> : <><span>Recargar Bolsillo</span><ArrowUpRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}

        {/* TAB 2: INITIAL BASELINES */}
        {activeTab === 'baseline' && (
          <form onSubmit={handleBaselineSubmit} className="space-y-4 text-xs">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Define con cuánto dinero comenzaste en cada cuenta o bolsillo. Esto nivelará tu balance real.
            </p>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {funds.map((f) => (
                <div
                  key={f.id}
                  className="p-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5"
                >
                  <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-slate-100">
                    <span className="truncate mr-2">{f.nombre}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Recargas: {formatCOP(f.recargas)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400">Línea Base:</span>
                    <input
                      type="number"
                      value={baselines[f.id] !== undefined ? baselines[f.id] : (f.saldo_inicial || 0)}
                      onChange={(e) =>
                        setBaselines({ ...baselines, [f.id]: Number(e.target.value) })
                      }
                      className="flex-1 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-purple-500/20 transition flex items-center justify-center space-x-1.5"
            >
              {saving ? <span>Guardando...</span> : <><span>Guardar Líneas Base</span><Check className="w-4 h-4" /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
