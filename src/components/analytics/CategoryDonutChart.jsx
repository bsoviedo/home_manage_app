import React, { useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut, getElementAtEvent } from 'react-chartjs-2';
import { Check, X } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CategoryDonutChart({
  categoriesData,
  onToggleCategory,
  onClearSelection,
  selectedCategories = []
}) {
  const chartRef = useRef(null);
  const dataMap = categoriesData || {};
  const labels = Object.keys(dataMap);
  const values = Object.values(dataMap);

  const hasData = labels.length > 0 && values.some((v) => v > 0);
  const chartLabels = hasData ? labels : ['Sin Gastos'];
  const chartValues = hasData ? values : [1];

  const palette = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b', '#f97316', '#14b8a6', '#a855f7'];

  // Colors: if categories are selected, dim unselected ones
  const bgColors = chartLabels.map((l, idx) => {
    const baseColor = palette[idx % palette.length];
    if (selectedCategories.length === 0) return baseColor;
    return selectedCategories.includes(l) ? baseColor : `${baseColor}26`; // 15% opacity
  });

  const borderColors = chartLabels.map((l, idx) => {
    const baseColor = palette[idx % palette.length];
    if (selectedCategories.length === 0) return 'transparent';
    return selectedCategories.includes(l) ? '#ffffff' : 'transparent';
  });

  const data = {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: selectedCategories.length > 0 ? 2 : 0,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    cutout: '70%',
  };

  const handleChartClick = (event) => {
    if (!onToggleCategory || !hasData) return;
    const elements = getElementAtEvent(chartRef.current, event);
    if (elements.length > 0) {
      const idx = elements[0].index;
      const clickedLabel = chartLabels[idx];
      onToggleCategory(clickedLabel);
    }
  };

  return (
    <div className="flex flex-col justify-between h-full space-y-3">
      {/* Header controls for multi-select */}
      <div className="flex items-center justify-between text-xs px-1">
        <span className="text-[11px] text-slate-400">
          {selectedCategories.length === 0
            ? 'Selecciona 1 o varias para comparar'
            : `${selectedCategories.length} ${selectedCategories.length === 1 ? 'categoría seleccionada' : 'categorías seleccionadas (Comparativa)'}`}
        </span>
        {selectedCategories.length > 0 && (
          <button
            onClick={onClearSelection}
            className="flex items-center space-x-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition"
          >
            <X className="w-3 h-3" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      <div className="relative h-56 flex items-center justify-center cursor-pointer">
        <Doughnut ref={chartRef} data={data} options={options} onClick={handleChartClick} />
      </div>

      {/* Interactive Category Buttons */}
      <div className="grid grid-cols-2 gap-1.5 mt-2 text-xs max-h-52 overflow-y-auto pr-1">
        {chartLabels.map((l, idx) => {
          const isSelected = selectedCategories.includes(l);
          const color = palette[idx % palette.length];
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onToggleCategory && onToggleCategory(l)}
              className={`flex items-center justify-between p-2 rounded-xl border text-left transition truncate ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold shadow-sm'
                  : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2 truncate mr-1">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate font-medium">{l}</span>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
