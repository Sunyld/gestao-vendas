import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Eye,
  DollarSign,
  CheckCircle,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { customerService } from "../services/api";

interface RepairItem {
  id: string;
  description: string;
  cost: number;
  paid?: boolean;
  paymentMethod?: string;
  paid_value?: number;
}

interface Vehicle {
  id: string;
  model: string;
  plate: string;
  items: RepairItem[];
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf_NUIT: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  vehicles: Vehicle[];
  created_at: string;
  updated_at: string;
}

function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; id?: string }>({ show: false });
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState<Omit<Customer, "id" | "created_at" | "updated_at">>({
    name: "",
    email: "",
    phone: "",
    cpf_NUIT: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    vehicles: [],
  });

  const [paymentData, setPaymentData] = useState<{
    [itemId: string]: { paid: boolean; method: string; paidValue?: number; change?: number };
  }>({});
  const [showPaymentPopup, setShowPaymentPopup] = useState<{ show: boolean; itemId?: string; message?: string }>({ show: false });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getCustomers();
      const mapped: Customer[] = (data || []).map((c: any) => ({
        ...c,
        cpf_NUIT: c.cpf_NUIT ?? c.cpf_cnpj ?? "",
        vehicles: (c.vehicles || []).map((v: any) => ({
          ...v,
          items: (v.items || []).map((it: any) => ({
            id: it.id,
            description: it.description,
            cost: Number(it.cost) || 0,
            paid: !!it.paid,
            paymentMethod: it.payment_method || undefined,
            paid_value: it.paid_value != null ? Number(it.paid_value) : undefined,
          })),
        })),
      }));
      setCustomers(mapped as Customer[]);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name.trim()) {
        setError("O nome do cliente é obrigatório");
      return;
    }

      if (selectedCustomer) {
        await customerService.updateCustomer(selectedCustomer.id, formData);
        for (const v of formData.vehicles) {
          let vehicleId = v.id;
          if (!vehicleId) {
            const created = await customerService.addVehicle(selectedCustomer.id, { model: v.model, plate: v.plate });
            vehicleId = created.id;
          } else {
            await customerService.updateVehicle(vehicleId, { model: v.model, plate: v.plate });
          }
          for (const it of v.items) {
            if (!it.id) await customerService.addRepairItem(vehicleId, { description: it.description, cost: it.cost });
            else await customerService.updateRepairItem(it.id, { description: it.description, cost: it.cost });
          }
        }
        setSuccessMessage("Cliente atualizado com sucesso!");
      } else {
        const created = await customerService.createCustomer(formData as any);
        const customerId = created.id;
        for (const v of formData.vehicles) {
          const vehicle = await customerService.addVehicle(customerId, { model: v.model, plate: v.plate });
          for (const it of v.items) await customerService.addRepairItem(vehicle.id, { description: it.description, cost: it.cost });
        }
        setSuccessMessage("Cliente cadastrado com sucesso!");
      }

      await fetchCustomers();
      setShowModal(false);
      setSelectedCustomer(null);
      resetForm();
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erro ao salvar cliente");
      setTimeout(() => setError(null), 2500);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      cpf_NUIT: customer.cpf_NUIT,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      postal_code: customer.postal_code,
      vehicles: customer.vehicles || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete({ show: true, id });
  };

  const confirmDeleteCustomer = async () => {
    if (!confirmDelete.id) return;
    try {
      await customerService.deleteCustomer(confirmDelete.id);
      setSuccessMessage("Cliente excluído com sucesso!");
      await fetchCustomers();
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erro ao excluir cliente");
      setTimeout(() => setError(null), 2500);
    } finally {
      setConfirmDelete({ show: false });
    }
  };

  const payAllForCustomer = async (customer: Customer, method: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/customers/${customer.id}/pay-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method: method })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao pagar todos os itens');
      }
      const res = await response.json();
      setSuccessMessage(`Pago ${res.paidCount} item(ns) de ${customer.name}. Total: R$ ${(Number(res.totalValue)||0).toFixed(2)}`);
      await fetchCustomers();
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err:any) {
      setError(err.message || 'Erro ao pagar todos os itens');
      setTimeout(() => setError(null), 2500);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      cpf_NUIT: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      vehicles: [],
    });
  };

  const addVehicle = () => {
    const newVehicle: Vehicle = { id: Date.now().toString(), model: "", plate: "", items: [ { id: (Date.now()+1).toString(), description: "", cost: 0, paid: false, paymentMethod: "" } ] };
    setFormData({ ...formData, vehicles: [...formData.vehicles, newVehicle] });
  };

  const updateVehicle = (vehicleId: string, field: string, value: string) => {
    setFormData({ ...formData, vehicles: formData.vehicles.map((v) => (v.id === vehicleId ? { ...v, [field]: value } : v)) });
  };

  const addRepairItem = (vehicleId: string) => {
    const newItem: RepairItem = { id: Date.now().toString(), description: "", cost: 0, paid: false, paymentMethod: "" };
    setFormData({ ...formData, vehicles: formData.vehicles.map((v) => (v.id === vehicleId ? { ...v, items: [...v.items, newItem] } : v)) });
  };

  const updateRepairItem = (vehicleId: string, itemId: string, field: string, value: string | number) => {
    setFormData({
      ...formData,
      vehicles: formData.vehicles.map((v) =>
        v.id === vehicleId ? { ...v, items: v.items.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)) } : v
      ),
    });
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.cpf_NUIT.includes(searchTerm)
  );

  const totalCustomers = customers.length;
  let totalItemsPaid = 0;
  let totalItemsPending = 0;
  customers.forEach((c) =>
    c.vehicles.forEach((v) => v.items.forEach((i) => (i.paid ? totalItemsPaid++ : totalItemsPending++)))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Clientes da Oficina</h2>
        <Button
            onClick={() => {
              setSelectedCustomer(null);
              resetForm();
              // Pré-adicionar 1 veículo e 1 item para facilitar cadastro
              const vId = Date.now().toString();
              const iId = (Date.now()+1).toString();
              setFormData((prev) => ({
                ...prev,
                vehicles: [
                  {
                    id: vId,
                    model: "",
                    plate: "",
                    items: [
                      { id: iId, description: "", cost: 0, paid: false, paymentMethod: "" }
                    ]
                  }
                ]
              }));
              setShowModal(true);
            }}
          icon={Plus}
        >
          Novo Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total de Clientes" value={totalCustomers.toString()} />
        <StatCard icon={CheckCircle} label="Itens Pagos" value={totalItemsPaid.toString()} />
        <StatCard icon={Clock} label="Itens Pendentes" value={totalItemsPending.toString()} />
        <StatCard icon={DollarSign} label="Total Itens" value={(totalItemsPaid + totalItemsPending).toString()} />
        </div>

        {error && (
        <div className="fixed top-6 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in">{error}</div>
      )}
      {successMessage && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in">{successMessage}</div>
      )}

      {confirmDelete.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <Card className="p-6 max-w-sm text-center space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Confirmar exclusão</h3>
            <p>Tem certeza que deseja excluir este cliente?</p>
            <div className="flex justify-center space-x-4">
              <Button variant="secondary" onClick={() => setConfirmDelete({ show: false })}>Cancelar</Button>
              <Button variant="destructive" onClick={confirmDeleteCustomer}>Excluir</Button>
            </div>
          </Card>
          </div>
        )}

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

      <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPF</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veículos</th>
                <th className="px-6 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{customer.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{customer.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{customer.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{customer.cpf_NUIT}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{customer.vehicles.length} veículo(s)</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleEdit(customer)} className="text-blue-500 hover:text-blue-600">
                          <Edit className="w-5 h-5" />
                        </button>
                      <button onClick={() => handleDelete(customer.id)} className="text-red-500 hover:text-red-600">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      <button onClick={() => { setSelectedCustomer(customer); setShowDetailsModal(true); }} className="text-green-500 hover:text-green-600">
                        <Eye className="w-5 h-5" />
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </Card>

      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50 overflow-auto">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 space-y-8 relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Detalhes de {selectedCustomer.name}</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg">
              <div className="space-y-2">
                <p><strong>Email:</strong> {selectedCustomer.email}</p>
                <p><strong>Telefone:</strong> {selectedCustomer.phone}</p>
                <p><strong>CPF/CNPJ:</strong> {selectedCustomer.cpf_NUIT}</p>
              </div>
              <div className="space-y-2">
                <p><strong>Endereço:</strong> {selectedCustomer.address}</p>
                <p><strong>Cidade/Estado:</strong> {selectedCustomer.city}-{selectedCustomer.state}</p>
                <p><strong>CEP:</strong> {selectedCustomer.postal_code}</p>
          </div>
              {/* Seção de pagamento em massa removida conforme solicitado */}
        </div>

            <div className="space-y-6">
              {selectedCustomer.vehicles.map(vehicle => (
                <div key={vehicle.id} className="border rounded-lg p-6 space-y-4 bg-gray-50">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>{vehicle.model} - {vehicle.plate}</span>
              </div>
                  {(() => {
                    const visibleItems = vehicle.items.filter(it => Number(it.paid_value || 0) < Number(it.cost || 0));
                    if (visibleItems.length === 0) {
                      return <p className="text-gray-500">Todos os itens deste veículo foram pagos.</p>;
                    }
                    return visibleItems.map(item => {
                    const payment = paymentData[item.id] || {};
                    const paidAccum = Number(item.paid_value || 0);
                    const remaining = Math.max(0, Number(item.cost || 0) - paidAccum);
                    let change = 0;
                    if (payment.method === "Dinheiro" && typeof payment.paidValue === 'number') {
                      change = payment.paidValue - remaining;
                      if (change < 0) change = 0;
                    }
                    
                    return (
                      <div key={item.id} className="p-3 border-b last:border-0 bg-white rounded-md shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
                          <span className="flex-1 font-medium">{item.description}</span>
                          <span className="w-56 text-right font-semibold">
                            R$ {item.cost.toFixed(2)}
                            {paidAccum > 0 && paidAccum < Number(item.cost || 0) ? ` (Pago: R$ ${paidAccum.toFixed(2)} | Falta: R$ ${remaining.toFixed(2)})` : ''}
                          </span>

                          <select
                            className="border p-2 rounded w-full md:w-40"
                            value={payment.method || ""}
                            onChange={(e) => {
                              setPaymentData({
                                ...paymentData,
                                [item.id]: { ...paymentData[item.id], method: e.target.value }
                              });
                            }}
                          >
                            <option value="">Selecionar pagamento</option>
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Cartão">Cartão</option>
                            <option value="Pix">Pix</option>
                          </select>

                          {payment.method === "Dinheiro" && (
                            <Input
                              type="number"
                              placeholder="Valor pago"
                              value={payment.paidValue || ""}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setPaymentData({
                                  ...paymentData,
                                  [item.id]: { ...paymentData[item.id], paidValue: val }
                                });
                              }}
                            />
                          )}

                          <Button
                            disabled={!payment.method || (payment.method === "Dinheiro" && (!(payment.paidValue >= remaining)))}
                            className="md:w-40"
                            onClick={async () => {
                              if (!payment.method) return;
                              try {
                                await customerService.payRepairItem(item.id, {
                                  payment_method: payment.method,
                                  paid_value: payment.paidValue,
                                });
                                setShowPaymentPopup({
                                  show: true,
                                  message: `Pagamento de "${item.description}" confirmado via ${payment.method}${change > 0 ? ` (Troco: R$ ${change.toFixed(2)})` : ""}`,
                                });
                                await fetchCustomers();
                                setPaymentData((prev) => { const up = { ...prev } as any; delete up[item.id]; return up; });
                                setTimeout(() => setShowPaymentPopup({ show: false }), 2500);
                              } catch (err: any) {
                                setError(err?.response?.data?.message || err.message || "Erro ao processar pagamento");
                                setTimeout(() => setError(null), 2500);
                              }
                            }}
                          >
                            Confirmar pagamento
                          </Button>
                        </div>

                        {payment.method === "Dinheiro" && typeof payment.paidValue === 'number' && (
                          <div className="mt-2 text-sm text-gray-600">
                            {payment.paidValue >= remaining
                              ? `Troco: R$ ${change.toFixed(2)}`
                              : `Falta: R$ ${(remaining - payment.paidValue).toFixed(2)}`}
                          </div>
                        )}
                      </div>
                    );
                  }); })()}
                    </div>
                  ))}
                </div>

            {showPaymentPopup.show && (
              <div className="absolute bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg animate-fade-in z-50">
                {showPaymentPopup.message}
                </div>
            )}
          </Card>
          </div>
        )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{selectedCustomer ? "Editar Cliente" : "Novo Cliente"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-5 h-5" />
                </button>
              </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Nome" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                <Input placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                <Input placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                <Input placeholder="CPF/NUIT" value={formData.cpf_NUIT} onChange={(e) => setFormData({ ...formData, cpf_NUIT: e.target.value })} />
                <Input placeholder="Endereço" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                <Input placeholder="Cidade" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                <Input placeholder="Estado" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                <Input placeholder="CEP" value={formData.postal_code} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} />
              </div>

              <div className="space-y-4">
                {formData.vehicles.map(vehicle => (
                  <Card key={vehicle.id} className="p-4 space-y-2 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Veículo</span>
                      <Button type="button" variant="destructive" onClick={() => {
                        setFormData({ ...formData, vehicles: formData.vehicles.filter(v => v.id !== vehicle.id) });
                      }}>Remover</Button>
                    </div>
                    <Input placeholder="Modelo" value={vehicle.model} onChange={(e) => updateVehicle(vehicle.id, "model", e.target.value)} />
                    <Input placeholder="Placa" value={vehicle.plate} onChange={(e) => updateVehicle(vehicle.id, "plate", e.target.value)} />

                    <div className="space-y-2 overflow-y-auto max-h-64">
                      {vehicle.items.map(item => (
                        <div key={item.id} className="flex gap-2">
                          <Input placeholder="Descrição" value={item.description} onChange={(e) => updateRepairItem(vehicle.id, item.id, "description", e.target.value)} />
                          <Input type="number" placeholder="Custo" value={item.cost} onChange={(e) => updateRepairItem(vehicle.id, item.id, "cost", parseFloat(e.target.value))} />
                          <Button type="button" variant="destructive" onClick={() => {
                            setFormData({ ...formData, vehicles: formData.vehicles.map(v => v.id === vehicle.id ? { ...v, items: v.items.filter(i => i.id !== item.id) } : v) });
                          }}>Remover</Button>
                        </div>
                      ))}
                      <Button type="button" onClick={() => addRepairItem(vehicle.id)}>Adicionar Item</Button>
                    </div>
                  </Card>
                ))}
                <Button type="button" onClick={addVehicle}>Adicionar Veículo</Button>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
            </div>
            </form>
          </Card>
          </div>
        )}
      </div>
  );
}

export default Customers;


