import React from 'react';
import { Calendar, AlertCircle, TrendingUp } from 'lucide-react';

export default function WeekdayExpensesChart({ weekdayData, peakDay }) {
  const data = weekdayData || {};
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const maxMonto = Math.max(...days.map((d) => data[d]?.monto || 0), 1);
  const totalMonto = days.reduce((acc, d) => acc + (data[d]?.monto || 0), 0);

  const formatCOP = (val) => '$' + Number(val || 0).toLocaleString('es-CO') + ' COP';

  return (
    <div className="bg-white dark:bg-[#131b2e] p-5 rounded-2xl border border-slate-200 dark:border-[#1f293d] shadow-sm transition-colors space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <span>Patrón de Gasto por Día de la Semana</span>
          </h3>
          <p className="text-[10px] text-slate-400">Descubre en qué días ocurren tus mayores consumos</p>
        </div>
        <Calendar className="w-4 h-4 text-purple-400" />
      </div>

      {/* Bars representation */}
      <div className="space-y-2">
        {days.map((d) => {
          const dayInfo = data[d] || { monto: 0, cantidad: 0 };
          const isPeak = peakDay?.dia === d && dayInfo.monto > 0;
          const pctOfMax = (dayInfo.monto / maxMonto) * 100;
          const pctOfTotal = totalMonto > 0 ? ((dayInfo.monto / totalMonto) * 100).toFixed(1) : '0.0';

          return (
            <div key={d} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className={ont-semibold }>
                    {d}
                  </span>
                  {isPeak && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                      Pico de gasto 🔥
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">({dayInfo.cantidad} movs)</span>
                </div>
                <div className="flex items-center space-x-2 text-right">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCOP(dayInfo.monto)}</span>
                  <span className="text-[10px] text-slate-400 w-10 text-right">{pctOfTotal}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPeak
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : 'bg-emerald-500/80 dark:bg-emerald-400/80'
                  }`}
                  style={{ width: `${pctOfMax}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight Highlight */}
      {peakDay?.dia && peakDay?.monto > 0 && (
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start space-x-2.5 text-xs text-purple-300">
          <TrendingUp className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-100">Día de mayor actividad: {peakDay.dia}</span>
            <p className="text-[11px] text-slate-400">
              Concentras el <strong className="text-purple-300">{peakDay.porcentaje}%</strong> del total gastado en los {peakDay.dia}s ({formatCOP(peakDay.monto)}).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
