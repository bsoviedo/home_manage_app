import React from 'react';
import { ArrowDownLeft, UserCheck, Users, Wallet } from 'lucide-react';

export default function KpiGrid({ resumen }) {
  const r = resumen || {};
  const formatCOP = (val) => '$' + Number(val || 0).toLocaleString('es-CO') + ' COP';

  const kpis = [
    {
      label: 'Ingresos Totales',
      value: formatCOP(r.total_ingresos),
      subtext: 'Entradas del mes',
      color: 'text-emerald-500 dark:text-emerald-400',
      icon: ArrowDownLeft,
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Gasto Neto Mío',
      value: formatCOP(r.total_gastos_neto_propio),
      subtext: 'De mi propio bolsillo',
      color: 'text-rose-500 dark:text-rose-400',
      icon: UserCheck,
      iconColor: 'text-rose-400',
    },
    {
      label: 'Terceros / Pareja',
      value: formatCOP(r.total_cubierto_terceros),
      subtext: 'Aportes sin inflar gasto',
      color: 'text-purple-500 dark:text-purple-400',
      icon: Users,
      iconColor: 'text-purple-400',
    },
    {
      label: 'Flujo / Ahorro',
      value: formatCOP(r.flujo_neto),
      subtext: 'Ingresos - Gasto Neto',
      color: 'text-blue-500 dark:text-blue-400',
      icon: Wallet,
      iconColor: 'text-blue-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200 dark:border-[#1f293d] shadow-sm transition-colors"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-medium">
              <span>{kpi.label}</span>
              <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
            </div>
            <div className={`text-lg md:text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <span className="text-[10px] text-slate-400">{kpi.subtext}</span>
          </div>
        );
      })}
    </div>
  );
}
