import React from 'react';

export default function FundsPills({ funds, resumen }) {
  const r = resumen || {};
  const formatCOP = (val) => '$' + Number(val || 0).toLocaleString('es-CO');

  return (
    <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-4 border border-slate-200 dark:border-[#1f293d] shadow-sm transition-colors">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Movimientos por Fondos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {funds.map((f) => {
          const g = (r.por_fondo_gasto && r.por_fondo_gasto[f.id]) || 0;
          const i = (r.por_fondo_ingreso && r.por_fondo_ingreso[f.id]) || 0;
          return (
            <div
              key={f.id}
              className="p-3 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
            >
              <div className="text-sm font-bold truncate">{f.nombre}</div>
              <div className="text-right flex-shrink-0">
                {i > 0 && <div className="text-[10px] text-emerald-400 font-bold">+{formatCOP(i)}</div>}
                {g > 0 ? (
                  <div className="text-[11px] text-rose-400 font-bold">-{formatCOP(g)}</div>
                ) : (
                  <div className="text-[10px] text-slate-500">$0</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
