import axios from "axios";

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || "http://localhost:3001",
  headers: { "Content-Type": "application/json" },
});

// Interceptor global para normalizar mensagens de erro
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response) {
      const message = error.response.data?.message || error.response.data?.error || 'Erro na requisição';
      return Promise.reject(new Error(message));
    }
    if (error?.request) {
      return Promise.reject(new Error('Falha de conexão com o servidor'));
    }
    return Promise.reject(new Error(error?.message || 'Erro desconhecido'));
  }
);

// Helpers de mapeamento de campos divergentes (cpf_NUIT <-> cpf_cnpj)
function mapClientToApi(payload: any) {
  const { cpf_NUIT, vehicles, ...rest } = payload || {};
  return {
    ...rest,
    cpf_cnpj: cpf_NUIT ?? payload?.cpf_cnpj ?? "",
  };
}

function mapClientFromApi(customer: any) {
  if (!customer) return customer;
  return {
    ...customer,
    cpf_NUIT: customer.cpf_NUIT ?? customer.cpf_cnpj ?? "",
    vehicles: Array.isArray(customer.vehicles) ? customer.vehicles.map((vehicle: any) => ({
      ...vehicle,
      items: Array.isArray(vehicle.items) ? vehicle.items.map((item: any) => ({
        ...item,
        cost: Number(item.cost) || 0,
        paid: Boolean(item.paid),
        paid_value: item.paid_value ? Number(item.paid_value) : null
      })) : []
    })) : [],
  };
}

export const customerService = {
  async getCustomers() {
    const { data } = await api.get("/api/customers");
    return (data || []).map(mapClientFromApi);
  },

  async createCustomer(payload: any) {
    const body = mapClientToApi(payload);
    const { data } = await api.post("/api/customers", body);
    return mapClientFromApi(data);
  },

  async updateCustomer(id: string, payload: any) {
    const body = mapClientToApi(payload);
    const { data } = await api.put(`/api/customers/${id}`, body);
    return mapClientFromApi(data);
  },

  async deleteCustomer(id: string) {
    await api.delete(`/api/customers/${id}`);
  },

  async addVehicle(customerId: string, payload: { model: string; plate: string }) {
    const { data } = await api.post(`/api/customers/${customerId}/vehicles`, payload);
    return data;
  },

  async updateVehicle(vehicleId: string, payload: { model: string; plate: string }) {
    const { data } = await api.put(`/api/customers/vehicles/${vehicleId}`, payload);
    return data;
  },

  async removeVehicle(vehicleId: string) {
    const { data } = await api.delete(`/api/customers/vehicles/${vehicleId}`);
    return data;
  },

  async addRepairItem(vehicleId: string, payload: { description: string; cost: number }) {
    const { data } = await api.post(`/api/customers/vehicles/${vehicleId}/items`, payload);
    return data;
  },

  async updateRepairItem(itemId: string, payload: { description: string; cost: number }) {
    const { data } = await api.put(`/api/customers/items/${itemId}`, payload);
    return data;
  },

  async removeRepairItem(itemId: string) {
    const { data } = await api.delete(`/api/customers/items/${itemId}`);
    return data;
  },

  async payRepairItem(itemId: string, payload: { payment_method: string; paid_value?: number }) {
    const { data } = await api.post(`/api/customers/items/${itemId}/pay`, payload);
    return data;
  },
};

export const salesService = {
  async listCompletedSales(params?: { startDate?: string; endDate?: string }) {
    const { data } = await api.get("/api/sales/completed", { params });
    return data;
  },

  async returnSale(saleId: string) {
    const { data } = await api.post(`/api/sales/${saleId}/return`);
    return data;
  },
};

export default api;


