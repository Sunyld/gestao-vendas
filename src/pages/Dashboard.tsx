import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Package, ArrowUp, ArrowDown } from 'lucide-react';
import { SalesChart } from '../components/SalesChart';
import { CategoryChart } from '../components/CategoryChart';

const StatCard = ({ icon: Icon, label, value }) => (
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
    </div>
  </div>
);

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:3001/api/dashboard");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao carregar dados");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <div className="text-center py-10 text-blue-600">Carregando...</div>;
  if (error) return <div className="text-center py-10 text-red-600">Erro: {error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={DollarSign}
          label="Faturamento"
          value={`R$ ${data.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        />
        <StatCard
          icon={ShoppingCart}
          label="Total de Vendas"
          value={data.totalSales}
        />
        <StatCard
          icon={Package}
          label="Ticket Médio"
          value={`R$ ${data.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        />
        <StatCard
          icon={TrendingUp}
          label="Lucro Líquido"
          value={`R$ ${data.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border">
          <h3 className="text-lg font-semibold mb-4">Vendas dos Últimos 7 Dias</h3>
          <SalesChart labels={data.salesLast7Days.labels} data={data.salesLast7Days.data} />
        </div>
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="text-lg font-semibold mb-4">Vendas por Categoria</h3>
          <CategoryChart labels={data.salesByCategory.labels} data={data.salesByCategory.data} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
