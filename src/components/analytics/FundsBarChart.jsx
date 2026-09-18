import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useSelector } from 'react-redux';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function FundsBarChart({ ownNet, thirdParty, income }) {
  const themeMode = useSelector((state) => state.theme.mode);

  const data = {
    labels: ['Gasto Mío (Neto)', 'Aporte Terceros', 'Ingresos'],
    datasets: [
      {
        data: [ownNet || 0, thirdParty || 0, income || 0],
        backgroundColor: ['#ef4444', '#8b5cf6', '#10b981'],
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: themeMode === 'dark' ? '#1f293d' : '#e2e8f0' },
      },
    },
  };

  return (
    <div className="relative h-64 flex items-center justify-center">
      <Bar data={data} options={options} />
    </div>
  );
}
