import React from 'react';
import { useDispatch } from 'react-redux';
import { Zap, Sliders, Wallet } from 'lucide-react';
import { openFundsModal } from '../../store/uiSlice';

export default function FundsPills({ funds = [], resumen = {} }) {
  const dispatch = useDispatch();
  const r = resumen || {};
  const fondosCalculados = r.fondos_calculados || [];
  const formatCOP = (val) => '$' + Number(val || 0).toLocaleString('es-CO') + ' COP';

  return (
    <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-[#1f293d] shadow-sm transition-colors space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center space-x-1.5">
            <Wallet className="w-4 h-4 text-purple-400" />
            <span>Bolsillos Financieros & Capital</span>
          </h2>
          <p className="text-[10px] text-slate-400">Saldo disponible real (Línea Base + Recargas - Gastos)</p>
        </div>

        <button
          onClick={() => dispatch(openFundsModal({ activeTab: 'recharge' }))}
          className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-semibold text-xs transition flex items-center space-x-1 border border-purple-500/20"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>⚡ Recargar / Ajustar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {funds.map((f) => {
          const calc = fondosCalculados.find((fc) => fc.id === f.id);
          const g = (r.por_fondo_gasto && r.por_fondo_gasto[f.id]) || 0;
          const i = (r.por_fondo_ingreso && r.por_fondo_ingreso[f.id]) || 0;
          const sIni = f.saldo_inicial || 0;
          const saldoDisp = calc?.saldo_actual !== undefined ? calc.saldo_actual : (i - g);

          return (
            <div
              key={f.id}
              onClick={() => dispatch(openFundsModal({ activeTab: 'recharge', selectedFundId: f.id }))}
              className="p-3.5 bg-slate-50 dark:bg-[#0b0f19] rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 cursor-pointer transition flex flex-col justify-between space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mr-1">
                  {f.nombre}
                </span>
                <span className="text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition font-semibold">
                  Recargar ⚡
                </span>
              </div>

              <div>
                <div className="text-[10px] text-slate-400">Saldo Disponible:</div>
                <div className={`text-sm font-bold ${saldoDisp >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500'}`}>
                  {formatCOP(saldoDisp)}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span className="text-emerald-400 font-medium">Ingresos: +{formatCOP(i).replace(' COP', '')}</span>
                <span className="text-rose-400 font-medium">Gasto: -{formatCOP(g).replace(' COP', '')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
