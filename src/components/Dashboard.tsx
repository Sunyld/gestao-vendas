import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, DollarSign, ShoppingCart, ArrowUp, ArrowDown } from 'lucide-react';
import { SalesChart } from '../components/SalesChart';
import { CategoryChart } from '../components/CategoryChart';

const StatCard = ({
  icon: Icon,
  label,
  value,
  trend,
  trendValue,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  trend: 'up' | 'down';
  trendValue: string;
}) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
      </div>
      <div className={`flex items-center space-x-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
        {trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
        <span className="text-sm font-medium">{trendValue}</span>
      </div>
    </div>
  </div>
);

interface DashboardData {
  totalSales: number;
  totalSalesTrend: number;
  totalOrders: number;
  totalOrdersTrend: number;
  totalStock: number;
  totalStockTrend: number;
  totalProfit: number;
  totalProfitTrend: number;
  salesLast7Days: {
    labels: string[];
    data: number[];
  };
  salesByCategory: {
    labels: string[];
    data: number[];
  };
}

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchDashboardData(selectedPeriod: 'day' | 'week' | 'month') {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const params = new URLSearchParams({ period: selectedPeriod });
      const response = await fetch(`http://localhost:3001/api/dashboard?${params.toString()}`);

      if (!response.ok) {
        let errorMessage = `Erro ao carregar dados do dashboard: ${response.status} ${response.statusText}`;
        try {
          const errorJson = await response.json();
          if (errorJson?.message) errorMessage = errorJson.message;
        } catch {
          // Ignora erro se JSON inválido
        }
        throw new Error(errorMessage);
      }

      const json: DashboardData = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData(period);
  }, [period]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="text-gray-600">Carregando dados...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 text-red-700 rounded flex flex-col items-center space-y-4">
        <p className="font-semibold">Erro:</p>
        <p>{error}</p>
        <button
          onClick={() => fetchDashboardData(period)}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Nenhum dado disponível no momento.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <div className="flex items-center space-x-4">
          <select
            className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm"
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'day' | 'week' | 'month')}
          >
            <option value="day">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={DollarSign}
          label="Vendas Totais"
          value={`R$ ${data.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={data.totalSalesTrend >= 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(data.totalSalesTrend)}%`}
        />
        <StatCard
          icon={ShoppingCart}
          label="Pedidos"
          value={data.totalOrders}
          trend={data.totalOrdersTrend >= 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(data.totalOrdersTrend)}%`}
        />
        <StatCard
          icon={Package}
          label="Produtos em Estoque"
          value={data.totalStock}
          trend={data.totalStockTrend >= 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(data.totalStockTrend)}%`}
        />
        <StatCard
          icon={TrendingUp}
          label="Lucro"
          value={`R$ ${data.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={data.totalProfitTrend >= 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(data.totalProfitTrend)}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas dos Últimos 7 Dias</h3>
          <SalesChart
            labels={data.salesLast7Days.labels}
            data={data.salesLast7Days.data}
          />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Categoria</h3>
          <CategoryChart
            labels={data.salesByCategory.labels}
            data={data.salesByCategory.data}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
