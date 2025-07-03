import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

type Supplier = {
  id: string;
  company_name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  contact_name?: string;
};

function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; company_name: string } | null>(null);

  const initialForm: Omit<Supplier, 'id'> = {
    company_name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    contact_name: '',
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/suppliers');
      if (!response.ok) throw new Error('Erro ao buscar fornecedores');
      const data = await response.json();
      setSuppliers(data);
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
      const isEditing = !!selectedSupplier?.id;
      const url = isEditing
        ? `http://localhost:3001/api/suppliers/${selectedSupplier.id}`
        : 'http://localhost:3001/api/suppliers';

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
        throw new Error(errorData.message || 'Erro ao salvar fornecedor');
      }

      setShowModal(false);
      setSelectedSupplier(null);
      setFormData(initialForm);
      fetchSuppliers();

      toast.success(isEditing ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor cadastrado com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar fornecedor');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/suppliers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao excluir fornecedor');
      }

      toast.success('Fornecedor excluído com sucesso!');
      fetchSuppliers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir fornecedor');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      company_name: supplier.company_name || '',
      cnpj: supplier.cnpj || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      contact_name: supplier.contact_name || '',
    });
    setShowModal(true);
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.cnpj?.includes(searchTerm) ?? false) ||
    (s.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Fornecedores</h2>
          <button
            onClick={() => {
              setSelectedSupplier(null);
              setFormData(initialForm);
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Fornecedor</span>
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
              placeholder="Buscar por empresa, CNPJ ou contato..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cidade/UF</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.company_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{s.cnpj}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{s.contact_name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{s.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{s.city || '-'} / {s.state || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-3">
                        <button onClick={() => handleEdit(s)} className="text-green-600 hover:text-green-700">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ id: s.id, company_name: s.company_name })}
                          className="text-red-600 hover:text-red-700"
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

        {/* Modal de Confirmação de Deleção */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4 text-center">
              <AlertCircle className="mx-auto w-12 h-12 text-red-600" />
              <h3 className="text-lg font-semibold">Excluir Fornecedor</h3>
              <p>Tem certeza que deseja excluir o fornecedor <strong>{confirmDelete.company_name}</strong>?</p>
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

export default Suppliers;
