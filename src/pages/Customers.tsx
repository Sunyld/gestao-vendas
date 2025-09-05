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
  AlertCircle
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

// Interfaces
interface RepairItem {
  id: string;
  description: string;
  cost: number;
  paid?: boolean;
  payment_method?: string;
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

// Botão genérico
const Button = ({ 
  children, 
  onClick, 
  icon: Icon, 
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  icon?: any;
  variant?: 'primary' | 'secondary' | 'destructive';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) => {
  const baseClasses = "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors";
  const variantClasses = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100",
    destructive: "bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300"
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{children}</span>
    </button>
  );
};

// Card simples
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
      {children}
    </div>
  );
};

// Card de estatísticas
const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => {
  return (
    <Card className="text-center">
      <div className="flex justify-center mb-2">
        <Icon className="w-8 h-8 text-blue-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-sm text-gray-500">{label}</p>
    </Card>
  );
};

function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; id?: string; name?: string }>({ show: false });
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

  // FETCH ALL CUSTOMERS
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:3001/api/customers");
      
      if (!res.ok) {
        throw new Error(`Erro ${res.status}: ${res.statusText}`);
      }
      
      // Verificar se a resposta é JSON antes de tentar parsear
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await res.text();
        console.error("Resposta não-JSON da API:", responseText.substring(0, 200));
        throw new Error("A API retornou um formato inesperado. Verifique se o endpoint está correto.");
      }
      
      const data: Customer[] = await res.json();
      setCustomers(data);
    } catch (err: any) {
      console.error("Erro ao carregar clientes:", err);
      setError(err.message || "Erro ao carregar clientes");
      toast.error(err.message || "Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  // CREATE / UPDATE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("O nome do cliente é obrigatório");
      return;
    }

    try {
      let res: Response;
      const url = selectedCustomer 
        ? `http://localhost:3001/api/customers/${selectedCustomer.id}`
        : `http://localhost:3001/api/customers`;
      
      res = await fetch(url, {
        method: selectedCustomer ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        // Verificar se a resposta é JSON antes de tentar parsear
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Erro ${res.status}: ${res.statusText}`);
        } else {
          throw new Error(`Erro ${res.status}: ${res.statusText}`);
        }
      }
      
      // Verificar se a resposta é JSON antes de tentar parsear
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("A API retornou um formato inesperado.");
      }
      
      toast.success(selectedCustomer ? "Cliente atualizado com sucesso!" : "Cliente cadastrado com sucesso!");
      
      fetchCustomers();
      setShowModal(false);
      setSelectedCustomer(null);
      resetForm();
    } catch (err: any) {
      console.error("Erro ao salvar cliente:", err);
      toast.error(err.message || "Erro ao salvar cliente");
    }
  };

  // EDIT
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
      vehicles: customer.vehicles || []
    });
    setShowModal(true);
  };

  // DELETE
  const handleDelete = (id: string, name: string) => setConfirmDelete({ show: true, id, name });
  
  const confirmDeleteCustomer = async () => {
    if (!confirmDelete.id) return;
    
    try {
      const res = await fetch(`http://localhost:3001/api/customers/${confirmDelete.id}`, { 
        method: "DELETE" 
      });
      
      if (!res.ok) {
        // Verificar se a resposta é JSON antes de tentar parsear
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Erro ${res.status}: ${res.statusText}`);
        } else {
          throw new Error(`Erro ${res.status}: ${res.statusText}`);
        }
      }
      
      // Verificar se a resposta é JSON antes de tentar parsear
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("A API retornou um formato inesperado.");
      }
      
      toast.success("Cliente excluído com sucesso!");
      fetchCustomers();
    } catch (err: any) {
      console.error("Erro ao deletar cliente:", err);
      toast.error(err.message || "Erro ao deletar cliente");
    }
    
    setConfirmDelete({ show: false });
  };

  // PROCESSAR PAGAMENTO
  const processPayment = async (itemId: string, method: string, paidValue?: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/repair-items/${itemId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, paidValue })
      });
      
      if (!res.ok) {
        // Verificar se a resposta é JSON antes de tentar parsear
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Erro ${res.status}: ${res.statusText}`);
        } else {
          throw new Error(`Erro ${res.status}: ${res.statusText}`);
        }
      }
      
      // Verificar se a resposta é JSON antes de tentar parsear
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("A API retornou um formato inesperado.");
      }
      
      return true;
    } catch (err: any) {
      console.error("Erro ao processar pagamento:", err);
      toast.error(err.message || "Erro ao processar pagamento");
      return false;
    }
  };

  // FORM HELPERS
  const resetForm = () => setFormData({ 
    name: "", 
    email: "", 
    phone: "", 
    cpf_NUIT: "", 
    address: "", 
    city: "", 
    state: "", 
    postal_code: "", 
    vehicles: [] 
  });
  
  const addVehicle = () => setFormData({ 
    ...formData, 
    vehicles: [...formData.vehicles, { 
      id: "", 
      model: "", 
      plate: "", 
      items: [] 
    }] 
  });
  
  const updateVehicle = (index: number, field: string, value: string) => {
    const updatedVehicles = [...formData.vehicles];
    updatedVehicles[index] = { ...updatedVehicles[index], [field]: value };
    setFormData({ ...formData, vehicles: updatedVehicles });
  };
  
  const removeVehicle = (index: number) => {
    const updatedVehicles = formData.vehicles.filter((_, i) => i !== index);
    setFormData({ ...formData, vehicles: updatedVehicles });
  };
  
  const addRepairItem = (vehicleIndex: number) => {
    const updatedVehicles = [...formData.vehicles];
    updatedVehicles[vehicleIndex] = {
      ...updatedVehicles[vehicleIndex],
      items: [...updatedVehicles[vehicleIndex].items, { 
        id: "", 
        description: "", 
        cost: 0 
      }]
    };
    setFormData({ ...formData, vehicles: updatedVehicles });
  };
  
  const updateRepairItem = (vehicleIndex: number, itemIndex: number, field: string, value: string | number) => {
    const updatedVehicles = [...formData.vehicles];
    const updatedItems = [...updatedVehicles[vehicleIndex].items];
    
    updatedItems[itemIndex] = { 
      ...updatedItems[itemIndex], 
      [field]: field === 'cost' ? Number(value) || 0 : value 
    };
    
    updatedVehicles[vehicleIndex] = {
      ...updatedVehicles[vehicleIndex],
      items: updatedItems
    };
    
    setFormData({ ...formData, vehicles: updatedVehicles });
  };
  
  const removeRepairItem = (vehicleIndex: number, itemIndex: number) => {
    const updatedVehicles = [...formData.vehicles];
    updatedVehicles[vehicleIndex] = {
      ...updatedVehicles[vehicleIndex],
      items: updatedVehicles[vehicleIndex].items.filter((_, i) => i !== itemIndex)
    };
    setFormData({ ...formData, vehicles: updatedVehicles });
  };

  // FILTER
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cpf_NUIT.includes(searchTerm)
  );

  // STATS
  const totalCustomers = customers.length;
  let totalItemsPaid = 0;
  let totalItemsPending = 0;
  let totalRevenue = 0;
  
  customers.forEach(c => c.vehicles.forEach(v => {
    v.items.forEach(i => {
      if (i.paid) {
        totalItemsPaid++;
        totalRevenue += i.cost;
      } else {
        totalItemsPending++;
      }
    });
  }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;

  if (error) {
    return (
      <div className="space-y-8 p-6">
        <Toaster position="top-right" />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="mx-auto w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Erro ao carregar clientes</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchCustomers}>Tentar Novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Clientes da Oficina</h2>
        <Button icon={Plus} onClick={() => { setSelectedCustomer(null); resetForm(); setShowModal(true); }}>Novo Cliente</Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total de Clientes" value={totalCustomers.toString()} />
        <StatCard icon={CheckCircle} label="Itens Pagos" value={totalItemsPaid.toString()} />
        <StatCard icon={Clock} label="Itens Pendentes" value={totalItemsPending.toString()} />
        <StatCard icon={DollarSign} label="Receita Total" value={`R$ ${totalRevenue.toFixed(2)}`} />
      </div>

      {/* SEARCH */}
      <div className="flex items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou CPF/NUIT..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPF/NUIT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veículos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{customer.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{customer.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{customer.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{customer.cpf_NUIT}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{customer.vehicles.length} veículo(s)</td>
                  <td className="px-6 py-4 text-sm text-gray-500 flex gap-3">
                    <button onClick={() => handleEdit(customer)} className="text-blue-500 hover:text-blue-600"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(customer.id, customer.name)} className="text-red-500 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                    <button onClick={() => { setSelectedCustomer(customer); setShowDetailsModal(true); }} className="text-green-500 hover:text-green-600"><Eye className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      {confirmDelete.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <Card className="p-6 max-w-sm text-center space-y-4">
            <AlertCircle className="mx-auto w-12 h-12 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">Confirmar exclusão</h3>
            <p>Tem certeza que deseja excluir o cliente <strong>{confirmDelete.name}</strong>?</p>
            <div className="flex justify-center space-x-4">
              <Button variant="secondary" onClick={() => setConfirmDelete({ show: false })}>Cancelar</Button>
              <Button variant="destructive" onClick={confirmDeleteCustomer}>Excluir</Button>
            </div>
          </Card>
        </div>
      )}

      {/* DETAILS MODAL */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50 overflow-auto">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 space-y-8 relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Detalhes de {selectedCustomer.name}</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Informações do cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg">
              <div className="space-y-2">
                <p><strong>Email:</strong> {selectedCustomer.email}</p>
                <p><strong>Telefone:</strong> {selectedCustomer.phone}</p>
                <p><strong>CPF/NUIT:</strong> {selectedCustomer.cpf_NUIT}</p>
              </div>
              <div className="space-y-2">
                <p><strong>Endereço:</strong> {selectedCustomer.address}</p>
                <p><strong>Cidade/Estado:</strong> {selectedCustomer.city}-{selectedCustomer.state}</p>
                <p><strong>CEP:</strong> {selectedCustomer.postal_code}</p>
              </div>
            </div>

            {/* Veículos e itens */}
            <div className="space-y-6">
              {selectedCustomer.vehicles.map(vehicle => (
                <div key={vehicle.id} className="border rounded-lg p-6 space-y-4 bg-gray-50">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>{vehicle.model} - {vehicle.plate}</span>
                  </div>
                  {vehicle.items.length === 0 && (
                    <p className="text-gray-500">Todos os itens deste veículo foram pagos.</p>
                  )}
                  {vehicle.items.map(item => {
                    const payment = paymentData[item.id] || {};
                    let change = 0;
                    if (payment.method === "Dinheiro" && payment.paidValue) {
                      change = payment.paidValue - item.cost;
                      if (change < 0) change = 0;
                    }
                    return (
                      <div key={item.id} className="p-3 border-b last:border-0 bg-white rounded-md shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
                          <span className="flex-1 font-medium">{item.description}</span>
                          <span className="w-24 text-right font-semibold">R$ {item.cost.toFixed(2)}</span>

                          {!item.paid ? (
                            <>
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
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Valor pago"
                                  className="border p-2 rounded w-full md:w-28 text-right"
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
                                disabled={!payment.method}
                                className="md:w-40"
                                onClick={async () => {
                                  if (!payment.method) return;

                                  const success = await processPayment(
                                    item.id, 
                                    payment.method, 
                                    payment.paidValue
                                  );

                                  if (success) {
                                    setShowPaymentPopup({
                                      show: true,
                                      message: `Pagamento de "${item.description}" confirmado via ${payment.method}${change > 0 ? ` (Troco: R$ ${change.toFixed(2)})` : ""}`
                                    });

                                    // Atualizar a lista de clientes após o pagamento
                                    fetchCustomers();

                                    setPaymentData(prev => {
                                      const updated = { ...prev };
                                      delete updated[item.id];
                                      return updated;
                                    });

                                    setTimeout(() => setShowPaymentPopup({ show: false }), 2500);
                                  }
                                }}
                              >
                                Confirmar pagamento
                              </Button>
                            </>
                          ) : (
                            <span className="text-green-600 font-medium">Pago ({item.payment_method})</span>
                          )}
                        </div>

                        {/* Troco abaixo da linha de inputs */}
                        {payment.method === "Dinheiro" && payment.paidValue !== undefined && (
                          <div className="mt-2 text-sm text-gray-600">
                            {change > 0 ? `Troco: R$ ${change.toFixed(2)}` : "Sem troco"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Popup de pagamento sobre o modal */}
            {showPaymentPopup.show && (
              <div className="absolute bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg animate-fade-in z-50">
                {showPaymentPopup.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CADASTRO/EDITAR */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{selectedCustomer ? "Editar Cliente" : "Novo Cliente"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome *</label>
                  <input
                    type="text"
                    placeholder="Nome"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input
                    type="text"
                    placeholder="Telefone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CPF/NUIT</label>
                  <input
                    type="text"
                    placeholder="CPF/NUIT"
                    value={formData.cpf_NUIT}
                    onChange={(e) => setFormData({ ...formData, cpf_NUIT: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Endereço</label>
                  <input
                    type="text"
                    placeholder="Endereço"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cidade</label>
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <input
                    type="text"
                    placeholder="Estado"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CEP</label>
                  <input
                    type="text"
                    placeholder="CEP"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Veículos */}
              <div className="space-y-4">
                {formData.vehicles.map((vehicle, vehicleIndex) => (
                  <div key={vehicleIndex} className="p-4 space-y-2 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Veículo</span>
                      <button 
                        type="button"
                        onClick={() => removeVehicle(vehicleIndex)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm"
                      >
                        Remover
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Modelo</label>
                      <input
                        type="text"
                        placeholder="Modelo"
                        value={vehicle.model}
                        onChange={(e) => updateVehicle(vehicleIndex, "model", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Placa</label>
                      <input
                        type="text"
                        placeholder="Placa"
                        value={vehicle.plate}
                        onChange={(e) => updateVehicle(vehicleIndex, "plate", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Itens de reparo */}
                    <div className="space-y-2 overflow-y-auto max-h-64">
                      {vehicle.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">Descrição</label>
                            <input
                              type="text"
                              placeholder="Descrição"
                              value={item.description}
                              onChange={(e) => updateRepairItem(vehicleIndex, itemIndex, "description", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="w-32">
                            <label className="block text-sm font-medium text-gray-700">Custo (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={isNaN(item.cost) ? "" : item.cost}
                              onChange={(e) => updateRepairItem(vehicleIndex, itemIndex, "cost", parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeRepairItem(vehicleIndex, itemIndex)}
                            className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm h-10"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button"
                        onClick={() => addRepairItem(vehicleIndex)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
                      >
                        Adicionar Item
                      </button>
                    </div>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={addVehicle}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
                >
                  Adicionar Veículo
                </button>
              </div>

              <div className="flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;