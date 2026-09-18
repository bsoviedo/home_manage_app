import React, { useEffect, useState } from 'react';
import { ArrowLeft, Wallet, Receipt, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function CategoryDrilldownView({ categoryId, period, onBack, totalPeriodExpenses }) {
  const [drillData, setDrillData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) return;
    setLoading(true);
    api.getCategoryDrilldown(categoryId, period)
      .then((res) => {
        setLoading(false);
        if (res.ok) {
          setDrillData(res);
        }
      })
      .catch(() => setLoading(false));
  }, [categoryId, period]);

  const formatCOP = (val) => '$' + Number(val || 0).toLocaleString('es-CO') + ' COP';

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-2 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        <span className="text-xs">Cargando desglose de categoría...</span>
      </div>
    );
  }

  if (!drillData) {
    return (
      <div className="text-center py-8 text-xs text-slate-400">
        No se pudo cargar el desglose.
        <button onClick={onBack} className="block mx-auto mt-2 text-emerald-400 underline">Volver</button>
      </div>
    );
  }

  const catTotal = drillData.total || 0;
  const percentage = totalPeriodExpenses > 0 ? ((catTotal / totalPeriodExpenses) * 100).toFixed(0) : 0;
  const fondosMap = drillData.por_fondo || {};

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header & Back button */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#0b0f19] text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white transition"
            title="Volver a la vista general"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <span>{drillData.categoria_nombre}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
                {percentage}% del total
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">{drillData.cantidad} transacciones en este periodo</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-emerald-500 dark:text-emerald-400">{formatCOP(catTotal)}</div>
        </div>
      </div>

      {/* Funds Breakdown for this category */}
      <div>
        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
          <Wallet className="w-3.5 h-3.5 text-purple-400" />
          <span>¿De qué fondos se pagó?</span>
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(fondosMap).length === 0 ? (
            <p className="text-xs text-slate-400 col-span-2">Sin desglose de fondos registrado.</p>
          ) : (
            Object.entries(fondosMap).map(([fondoNom, monto]) => (
              <div
                key={fondoNom}
                className="p-2.5 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
              >
                <span className="text-[11px] font-medium text-slate-400 truncate">{fondoNom}</span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">{formatCOP(monto)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transactions in this Category */}
      <div>
        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
          <Receipt className="w-3.5 h-3.5 text-emerald-400" />
          <span>Movimientos de la categoría</span>
        </h4>
        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
          {(!drillData.transacciones || drillData.transacciones.length === 0) ? (
            <p className="text-xs text-slate-400 py-2">No hay movimientos en este periodo.</p>
          ) : (
            drillData.transacciones.map((t) => (
              <div
                key={t.id}
                className="p-2 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-xs"
              >
                <div className="truncate mr-2">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{t.descripcion}</div>
                  <div className="text-[10px] text-slate-400">{t.fecha?.substring(0, 10)}</div>
                </div>
                <div className="font-bold text-rose-500 dark:text-rose-400 flex-shrink-0">
                  -{formatCOP(t.monto)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
