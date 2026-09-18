import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PieChart, BarChart3 } from 'lucide-react';
import CategoryDonutChart from '../components/analytics/CategoryDonutChart';
import FundsBarChart from '../components/analytics/FundsBarChart';
import CategoryDrilldownView from '../components/analytics/CategoryDrilldownView';
import { fetchAnalytics } from '../store/financeSlice';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('month');
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState(null);
  const dispatch = useDispatch();
  const { analytics, categoriesExpense } = useSelector((state) => state.finance);

  useEffect(() => {
    dispatch(fetchAnalytics(period));
  }, [period, dispatch]);

  const periods = [
    { id: 'month', label: 'Este Mes' },
    { id: 'last_month', label: 'Mes Pasado' },
    { id: 'year', label: 'Año Actual' },
  ];

  // Helper to find category ID from label
  const getCategoryIdFromLabel = (label) => {
    if (!label) return null;
    const found = categoriesExpense.find(
      (c) => c.nombre.toLowerCase() === label.toLowerCase() || label.toLowerCase().includes(c.id) || label.toLowerCase().includes(c.nombre.toLowerCase())
    );
    return found ? found.id : label.toLowerCase().replace(/[^a-z0-9]/g, '_');
  };

  const selectedCategoryId = getCategoryIdFromLabel(selectedCategoryLabel);

  return (
    <div className="space-y-6">
      {/* Period Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-[#131b2e] p-3 rounded-2xl border border-slate-200 dark:border-[#1f293d] transition-colors">
        <div className="flex items-center space-x-1.5">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPeriod(p.id);
                setSelectedCategoryLabel(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                period === p.id
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {analytics?.period_label || 'Periodo actual'}
        </div>
      </div>

      {/* Charts / Drilldown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Donut (Clickable) */}
        <div className="bg-white dark:bg-[#131b2e] p-5 rounded-2xl border border-slate-200 dark:border-[#1f293d] shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-sm">Distribución por Categorías</h3>
              <p className="text-[10px] text-slate-400">Toca cualquier categoría para ver su desglose</p>
            </div>
            <PieChart className="w-4 h-4 text-emerald-400" />
          </div>
          <CategoryDonutChart
            categoriesData={analytics?.categorias_gasto}
            selectedCategory={selectedCategoryLabel}
            onSelectCategory={(label) => {
              if (selectedCategoryLabel === label) {
                setSelectedCategoryLabel(null);
              } else {
                setSelectedCategoryLabel(label);
              }
            }}
          />
        </div>

        {/* Dynamic Right Column: Either FundsBarChart OR CategoryDrilldownView */}
        <div className="bg-white dark:bg-[#131b2e] p-5 rounded-2xl border border-slate-200 dark:border-[#1f293d] shadow-sm flex flex-col justify-between transition-colors">
          {selectedCategoryLabel && selectedCategoryId ? (
            <CategoryDrilldownView
              categoryId={selectedCategoryId}
              period={period}
              totalPeriodExpenses={analytics?.total_gastos_bruto || 0}
              onBack={() => setSelectedCategoryLabel(null)}
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm">Comparativa de Fondos</h3>
                  <p className="text-[10px] text-slate-400">Gasto propio vs Aporte de terceros vs Ingresos</p>
                </div>
                <BarChart3 className="w-4 h-4 text-purple-400" />
              </div>
              <FundsBarChart
                ownNet={analytics?.total_gasto_neto_propio}
                thirdParty={analytics?.total_cubierto_terceros}
                income={analytics?.total_ingresos}
              />
              <p className="text-[11px] text-slate-400 text-center mt-3">
                💡 Consejo: Haz clic en cualquier categoría de la izquierda para ver qué fondos la financiaron.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
