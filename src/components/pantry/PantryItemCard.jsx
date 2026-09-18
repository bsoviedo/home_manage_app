import React from 'react';
import { Utensils, AlertTriangle } from 'lucide-react';

export default function PantryItemCard({ item, onConsume, onDamage }) {
  const created = new Date(item.created_at);
  const now = new Date();
  const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));

  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (diffDays > 14) badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  else if (diffDays > 7) badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';

  const formatCOP = (val) => '$' + Number(val || 0).toLocaleString('es-CO');

  return (
    <div className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200 dark:border-[#1f293d] shadow-sm flex flex-col justify-between space-y-3 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#0b0f19] flex items-center justify-center text-lg">
            🥫
          </div>
          <div>
            <h4 className="font-bold text-xs leading-tight">{item.nombre_producto}</h4>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {item.created_at?.substring(0, 10)} • {formatCOP(item.precio)}
            </div>
          </div>
        </div>
        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${badgeColor}`}>
          {diffDays === 0 ? 'Hoy' : `Hace ${diffDays}d`}
        </span>
      </div>

      <div className="flex items-center space-x-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
        <button
          onClick={() => onConsume(item.id)}
          className="flex-1 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold active:scale-95 transition flex items-center justify-center space-x-1"
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Consumir</span>
        </button>
        <button
          onClick={() => onDamage(item.id)}
          className="flex-1 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold active:scale-95 transition flex items-center justify-center space-x-1"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Dañado</span>
        </button>
      </div>
    </div>
  );
}
