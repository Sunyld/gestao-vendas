import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { Calendar, Download } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const ReportCard = ({ title, children }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

function Reports() {
  const [period, setPeriod] = useState('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const [reportData, setReportData] = useState({
    dailySales: { labels: [], datasets: [] },
    categorySales: { labels: [], datasets: [] },
    paymentMethods: { labels: [], datasets: [] },
    financialSummary: {
      totalRevenue: 0,
      averageTicket: 0,
      totalSales: 0,
      netProfit: 0,
      growthRevenuePercent: 0,
      growthTicketPercent: 0,
      growthSalesPercent: 0,
      growthProfitPercent: 0,
    },
  });

  const [salesHistory, setSalesHistory] = useState([]);

  const calculateDates = () => {
    const end = new Date();
    let start = new Date();

    switch (period) {
      case 'day':
        break;
      case 'week':
        start.setDate(end.getDate() - 6);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      default:
        return;
    }

    if (period !== 'custom') {
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  const fetchReports = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const { data } = await axios.get('http://localhost:3001/api/reports', {
        params: { start: startDate, end: endDate },
      });

      setReportData({
        dailySales: {
          labels: data.dailySales.labels,
          datasets: [{
            label: 'Vendas Diárias',
            data: data.dailySales.data,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: 'rgb(59, 130, 246)',
            fill: true,
          }],
        },
        categorySales: {
          labels: data.categorySales.labels,
          datasets: [{
            data: data.categorySales.data,
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(139, 92, 246, 0.8)',
            ],
          }],
        },
        paymentMethods: {
          labels: data.paymentMethods.labels,
          datasets: [{
            label: 'Total por Método',
            data: data.paymentMethods.data,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
          }],
        },
        financialSummary: data.financialSummary,
      });
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      alert('Erro ao buscar relatórios.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesHistory = async () => {
    try {
      const { data } = await axios.get('http://localhost:3001/api/sales/history', {
        params: { start: startDate, end: endDate },
      });
      setSalesHistory(data);
    } catch (error) {
      console.error('Erro ao buscar histórico de vendas:', error);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await axios.get('http://localhost:3001/api/reports/export', {
        params: { start: startDate, end: endDate, format },
        responseType: 'blob',
      });

      const contentDisposition = response.headers['content-disposition'];
      let filename = `relatorio_vendas.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match?.[1]) {
          filename = match[1];
        }
      }

      const blob = new Blob([response.data], {
        type: format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error(`Erro ao exportar ${format}:`, error);
      alert(`Erro ao exportar ${format}.`);
    }
  };

  useEffect(() => {
    calculateDates();
  }, [period]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReports();
      fetchSalesHistory();
    }
  }, [startDate, endDate]);

  return (
    <div className="space-y-8">
      {/* Filtros e Ações */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center px-4 py-2 bg-white border rounded-lg space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent text-sm outline-none"
            >
              <option value="day">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <span className="text-gray-500">até</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              disabled={loading}
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
            <button
              disabled={loading}
              onClick={() => handleExport('excel')}
              className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <Download className="w-4 h-4" /> Excel
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Carregando relatórios...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportCard title="Vendas por Período">
            <Line
              data={reportData.dailySales}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => `R$ ${ctx.raw.toFixed(2)}`
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `R$ ${value.toFixed(2)}`,
                    },
                  },
                },
              }}
            />
          </ReportCard>

          <ReportCard title="Vendas por Categoria">
            <div className="h-[300px] flex justify-center items-center">
              <Pie
                data={reportData.categorySales}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'right' } },
                }}
              />
            </div>
          </ReportCard>

          {/* <ReportCard title="Histórico de Vendas">
            <div className="overflow-auto max-h-[320px]">
              <table className="w-full text-sm text-left border border-gray-200">
                <thead className="bg-gray-50 text-gray-600 font-semibold">
                  <tr>
                    <th className="px-4 py-2">Produto</th>
                    <th className="px-4 py-2">Qtd</th>
                    <th className="px-4 py-2">Valor</th>
                    <th className="px-4 py-2">Método</th>
                    <th className="px-4 py-2">Cliente</th>
                    <th className="px-4 py-2">Hora</th>
                    <th className="px-4 py-2">Vendedor</th>
                  </tr>
                </thead>
                <tbody>
                  {salesHistory.map((sale, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">{sale.product}</td>
                      <td className="px-4 py-2">{sale.quantity}</td>
                      <td className="px-4 py-2">R$ {sale.value.toFixed(2)}</td>
                      <td className="px-4 py-2">{sale.paymentMethod}</td>
                      <td className="px-4 py-2">{sale.customerName || '-'}</td>
                      <td className="px-4 py-2">{new Date(sale.timestamp).toLocaleTimeString()}</td>
                      <td className="px-4 py-2">{sale.sellerName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportCard> */}

          <ReportCard title="Resumo Financeiro">
            <div className="space-y-4">
              {[{
                label: 'Faturamento Total',
                value: reportData.financialSummary.totalRevenue,
                growth: reportData.financialSummary.growthRevenuePercent,
              },
              {
                label: 'Ticket Médio',
                value: reportData.financialSummary.averageTicket,
                growth: reportData.financialSummary.growthTicketPercent,
              },
              {
                label: 'Total de Vendas',
                value: reportData.financialSummary.totalSales,
                growth: reportData.financialSummary.growthSalesPercent,
              }].map(({ label, value, growth }, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {label.includes('Vendas') ? value : `R$ ${value.toFixed(2)}`}
                    </p>
                  </div>
                  <div className={`text-sm ${growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {growth >= 0 ? '+' : ''}{growth}% em relação ao período anterior
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>
        </div>
      )}
    </div>
  );
}

export default Reports;
