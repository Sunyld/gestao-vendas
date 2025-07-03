import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf_cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
};

function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Estado para confirmação de deleção
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const initialForm: Omit<Customer, 'id'> = {
    name: '',
    email: '',
    phone: '',
    cpf_cnpj: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/customers');
      if (!response.ok) throw new Error('Erro ao buscar clientes');
      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const cleanData = (data: typeof formData) => {
    const cleaned: any = {};
    for (const key in data) {
      cleaned[key] = data[key as keyof typeof data] || '';
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanedData = cleanData(formData);

    try {
      const isEditing = !!selectedCustomer?.id;
      const url = isEditing
        ? `http://localhost:3001/api/customers/${selectedCustomer.id}`
        : 'http://localhost:3001/api/customers';

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao salvar cliente');
      }

      setShowModal(false);
      setSelectedCustomer(null);
      setFormData(initialForm);
      fetchCustomers();

      toast.success(isEditing ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar cliente');
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      setError('ID do cliente inválido');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/customers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao excluir cliente');
      }

      fetchCustomers();
      toast.success('Cliente excluído com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir cliente');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      cpf_cnpj: customer.cpf_cnpj || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      postal_code: customer.postal_code || '',
    });
    setShowModal(true);
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (c.cpf_cnpj?.includes(searchTerm) ?? false)
  );

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setFormData(initialForm);
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Cliente</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="flex items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou CPF/CNPJ..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPF/CNPJ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cidade/UF</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{c.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{c.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{c.cpf_cnpj}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{c.city}/{c.state}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-3">
                        <button onClick={() => handleEdit(c)} className="text-blue-500 hover:text-blue-600">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ id: c.id, name: c.name })}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Cadastro/edição */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-xl font-semibold">{selectedCustomer ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(formData).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 capitalize">{key.replace('_', ' ')}</label>
                      <input
                        type={key === 'email' ? 'email' : 'text'}
                        required={key === 'name' || key === 'cpf_cnpj'}
                        value={value || ''}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg">
                    {selectedCustomer ? 'Salvar' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Confirmação de Deleção */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4 text-center">
              <AlertCircle className="mx-auto w-12 h-12 text-red-500" />
              <h3 className="text-lg font-semibold">Excluir Cliente</h3>
              <p>Tem certeza que deseja excluir o cliente <strong>{confirmDelete.name}</strong>?</p>
              <div className="flex justify-center space-x-4 pt-4">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Customers;
