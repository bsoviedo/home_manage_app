import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PieChart, BarChart3, Calendar, RotateCcw } from 'lucide-react';
import CategoryDonutChart from '../components/analytics/CategoryDonutChart';
import FundsBarChart from '../components/analytics/FundsBarChart';
import CategoryDrilldownView from '../components/analytics/CategoryDrilldownView';
import CategoryCompareView from '../components/analytics/CategoryCompareView';
import WeekdayExpensesChart from '../components/analytics/WeekdayExpensesChart';
import { fetchAnalytics } from '../store/financeSlice';

export default function AnalyticsPage() {
  const dispatch = useDispatch();
  const { analytics, categoriesExpense } = useSelector((state) => state.finance);

  const [period, setPeriod] = useState('month');
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategoryLabels, setSelectedCategoryLabels] = useState([]);

  const periods = [
    { id: 'month', label: 'Este Mes' },
    { id: 'q1', label: 'Quincena 1 (1 - 15)' },
    { id: 'q2', label: 'Quincena 2 (16 - Fin)' },
    { id: 'last_15', label: 'Últimos 15 días' },
    { id: 'last_month', label: 'Mes Pasado' },
    { id: 'year', label: 'Año' },
  ];

  const loadAnalytics = useCallback(() => {
    if (isCustomDate && startDate && endDate) {
      dispatch(fetchAnalytics({ fecha_inicio: startDate, fecha_fin: endDate }));
    } else {
      dispatch(fetchAnalytics(period));
    }
  }, [dispatch, isCustomDate, startDate, endDate, period]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Helper to find category ID from label
  const getCategoryIdFromLabel = (label) => {
    if (!label) return null;
    const found = categoriesExpense.find(
      (c) => c.nombre.toLowerCase() === label.toLowerCase() || label.toLowerCase().includes(c.id) || label.toLowerCase().includes(c.nombre.toLowerCase())
    );
    return found ? found.id : label.toLowerCase().replace(/[^a-z0-9]/g, '_');
  };

  const handleToggleCategory = (label) => {
    setSelectedCategoryLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleClearSelection = () => {
    setSelectedCategoryLabels([]);
  };

  const handleSelectPreset = (pId) => {
    setIsCustomDate(false);
    setPeriod(pId);
  };

  const handleActivateCustom = () => {
    setIsCustomDate(true);
    const today = new Date().toISOString().substring(0, 10);
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
    if (!startDate) setStartDate(firstDay);
    if (!endDate) setEndDate(today);
  };

  const selectedCategoryIds = selectedCategoryLabels
    .map((lbl) => getCategoryIdFromLabel(lbl))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Period & Date Filter Bar */}
      <div className="bg-white dark:bg-[#131b2e] p-3 rounded-2xl border border-slate-200 dark:border-[#1f293d] transition-colors space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Preset Buttons */}
          <div className="flex items-center space-x-1.5 flex-wrap">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  !isCustomDate && period === p.id
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}

            <button
              onClick={handleActivateCustom}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
                isCustomDate
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Personalizado</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            {analytics?.period_label || 'Periodo actual'}
          </div>
        </div>

        {/* Custom Date Pickers */}
        {isCustomDate && (
          <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs animate-in fade-in duration-150">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-medium">Desde:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-medium">Hasta:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Charts / Drilldown / Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Donut (Multi-Selectable) */}
        <div className="bg-white dark:bg-[#131b2e] p-5 rounded-2xl border border-slate-200 dark:border-[#1f293d] shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-sm">Distribución por Categorías</h3>
              <p className="text-[10px] text-slate-400">Selecciona una o más categorías para ver detalles o comparar</p>
            </div>
            <PieChart className="w-4 h-4 text-emerald-400" />
          </div>
          <CategoryDonutChart
            categoriesData={analytics?.categorias_gasto}
            selectedCategories={selectedCategoryLabels}
            onToggleCategory={handleToggleCategory}
            onClearSelection={handleClearSelection}
          />
        </div>

        {/* Dynamic Right Column:
            0 selected -> FundsBarChart
            1 selected -> CategoryDrilldownView
            2+ selected -> CategoryCompareView
        */}
        <div className="bg-white dark:bg-[#131b2e] p-5 rounded-2xl border border-slate-200 dark:border-[#1f293d] shadow-sm flex flex-col justify-between transition-colors">
          {selectedCategoryLabels.length === 1 && selectedCategoryIds.length === 1 ? (
            <CategoryDrilldownView
              categoryId={selectedCategoryIds[0]}
              period={isCustomDate ? null : period}
              startDate={isCustomDate ? startDate : null}
              endDate={isCustomDate ? endDate : null}
              totalPeriodExpenses={analytics?.total_gastos_bruto || 0}
              onBack={handleClearSelection}
            />
          ) : selectedCategoryLabels.length >= 2 && selectedCategoryIds.length >= 2 ? (
            <CategoryCompareView
              categoryIds={selectedCategoryIds}
              categoryLabels={selectedCategoryLabels}
              period={isCustomDate ? null : period}
              startDate={isCustomDate ? startDate : null}
              endDate={isCustomDate ? endDate : null}
              totalPeriodExpenses={analytics?.total_gastos_bruto || 0}
              onBack={handleClearSelection}
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
                💡 Consejo: Selecciona 1 categoría de la izquierda para ver su desglose, o selecciona 2 o más para compararlas entre sí.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Weekday Expenses Analysis */}
      <WeekdayExpensesChart
        weekdayData={analytics?.por_dia_semana}
        peakDay={analytics?.dia_mayor_gasto}
      />
    </div>
  );
}
