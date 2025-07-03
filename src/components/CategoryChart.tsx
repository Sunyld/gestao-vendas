import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryChartProps {
  labels: string[];
  data: number[];
}

export function CategoryChart({ labels, data }: CategoryChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // azul
          'rgba(16, 185, 129, 0.8)',   // verde
          'rgba(245, 158, 11, 0.8)',   // amarelo
          'rgba(239, 68, 68, 0.8)',    // vermelho
          'rgba(139, 92, 246, 0.8)',   // roxo
          // Adicione mais cores caso tenha mais categorias
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value}`;
          }
        }
      }
    },
  };

  return (
    <div className="h-[300px]">
      <Pie data={chartData} options={options} />
    </div>
  );
}
