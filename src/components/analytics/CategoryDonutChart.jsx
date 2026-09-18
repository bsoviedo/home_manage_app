import React, { useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut, getElementAtEvent } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CategoryDonutChart({ categoriesData, onSelectCategory, selectedCategory }) {
  const chartRef = useRef(null);
  const dataMap = categoriesData || {};
  const labels = Object.keys(dataMap);
  const values = Object.values(dataMap);

  const hasData = labels.length > 0 && values.some((v) => v > 0);
  const chartLabels = hasData ? labels : ['Sin Gastos'];
  const chartValues = hasData ? values : [1];

  const palette = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'];

  const data = {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues,
        backgroundColor: palette,
        borderWidth: 0,
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
    if (!onSelectCategory || !hasData) return;
    const elements = getElementAtEvent(chartRef.current, event);
    if (elements.length > 0) {
      const idx = elements[0].index;
      const clickedLabel = chartLabels[idx];
      onSelectCategory(clickedLabel);
    }
  };

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="relative h-56 flex items-center justify-center cursor-pointer">
        <Doughnut ref={chartRef} data={data} options={options} onClick={handleChartClick} />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
        {chartLabels.map((l, idx) => {
          const isSelected = selectedCategory === l;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectCategory && onSelectCategory(l)}
              className={`flex items-center space-x-1.5 p-1.5 rounded-xl border text-left transition truncate ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold'
                  : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: palette[idx % palette.length] }}
              />
              <span className="truncate font-medium">{l}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
