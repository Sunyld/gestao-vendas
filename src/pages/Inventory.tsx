import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, X, Edit, Trash } from 'lucide-react';

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  min_stock: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    price: '',
    stock: '',
    min_stock: ''
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const toastIdRef = React.useRef(0);
  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/products');
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erro ao buscar produtos: ${errorText || res.statusText}`);
      }
      let data: Product[] = await res.json();
      data = data.map(prod => ({
        ...prod,
        price: Number(prod.price),
        stock: Number(prod.stock),
        min_stock: Number(prod.min_stock),
      }));
      if (!Array.isArray(data)) throw new Error('Dados de produtos inválidos');
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.code.trim()) errors.code = 'Código é obrigatório.';
    if (!formData.name.trim()) errors.name = 'Nome é obrigatório.';
    if (!formData.price.trim()) errors.price = 'Preço é obrigatório.';
    else if (isNaN(Number(formData.price)) || Number(formData.price) < 0)
      errors.price = 'Preço inválido.';
    if (!formData.stock.trim()) errors.stock = 'Estoque é obrigatório.';
    else if (!Number.isInteger(Number(formData.stock)) || Number(formData.stock) < 0)
      errors.stock = 'Estoque inválido.';
    if (!formData.min_stock.trim()) errors.min_stock = 'Estoque mínimo é obrigatório.';
    else if (!Number.isInteger(Number(formData.min_stock)) || Number(formData.min_stock) < 0)
      errors.min_stock = 'Estoque mínimo inválido.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;

    setSubmitting(true);

    const body = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      category: formData.category.trim(),
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      min_stock: parseInt(formData.min_stock),
    };

    try {
      const res = await fetch(
        editId ? `http://localhost:3001/api/products/${editId}` : 'http://localhost:3001/api/products',
        {
          method: editId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        let errorMessage = 'Erro ao salvar produto.';
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          const text = await res.text();
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      await fetchProducts();
      resetForm(true);
      addToast(editId ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = (closeModal = false) => {
    setFormData({ code: '', name: '', category: '', price: '', stock: '', min_stock: '' });
    setEditId(null);
    setError(null);
    setFormErrors({});
    if (closeModal) setShowModal(false);
  };

  const openEditModal = (product: Product) => {
    setFormData({
      code: product.code,
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      min_stock: product.min_stock.toString(),
    });
    setEditId(product.id);
    setShowModal(true);
    setError(null);
    setFormErrors({});
  };

  const openNewProductModal = () => {
    resetForm(false);
    setShowModal(true);
  };

  const openDeleteModal = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setError(null);
    try {
      const res = await fetch(`http://localhost:3001/api/products/${productToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        let errorMessage = 'Erro ao deletar produto.';
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          const text = await res.text();
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }
      await fetchProducts();
      addToast('Produto deletado com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = products.filter(product => {
    const searchTermLower = searchTerm.toLowerCase();
    const searchMatch =
      product.name.toLowerCase().includes(searchTermLower) ||
      product.code.toLowerCase().includes(searchTermLower);
    const categoryMatch = selectedCategory === 'all' || product.category === selectedCategory;
    return searchMatch && categoryMatch;
  });

  const getStockStatus = (stock: number, min: number) => {
    if (stock === 0) return { color: 'text-red-500', text: 'Sem estoque' };
    if (stock < min) return { color: 'text-yellow-500', text: 'Estoque baixo' };
    return { color: 'text-green-500', text: 'Normal' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      {/* Toast Container */}
      <div className="fixed top-5 right-5 space-y-2 z-50">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`max-w-sm px-4 py-3 rounded shadow-lg text-white ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            } animate-fade-in-down`}
            style={{ animationDuration: '0.3s' }}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Modal de confirmação de exclusão */}
      {deleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-60 px-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Confirmar Exclusão</h3>
            <p className="mb-6">
              Deseja realmente deletar o produto <strong>{productToDelete?.name}</strong>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded">
            <strong>Erro:</strong> {error}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Controle de Estoque</h2>
          <button
            onClick={openNewProductModal}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Produto</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded shadow flex items-center space-x-2">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar produto..."
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="flex space-x-2">
          {categories.map(cat => (
            <button
              key={cat}
              className={`px-3 py-1 rounded ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? 'Todas' : cat}
            </button>
          ))}
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="p-3 text-left">Código</th>
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left">Categoria</th>
                <th className="p-3 text-left">Preço</th>
                <th className="p-3 text-left">Estoque</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => {
                  const status = getStockStatus(prod.stock, prod.min_stock);
                  // Converter preço para número e formatar
                  const priceNumber = Number(prod.price);
                  const priceFormatted = !isNaN(priceNumber) ? priceNumber.toFixed(2) : '0.00';

                  return (
                    <tr key={prod.id} className="border-t border-gray-100">
                      <td className="p-3">{prod.code}</td>
                      <td className="p-3">{prod.name}</td>
                      <td className="p-3">{prod.category}</td>
                      <td className="p-3">R$ {priceFormatted}</td>
                      <td className="p-3">{prod.stock}</td>
                      <td className={`p-3 font-medium ${status.color}`}>{status.text}</td>
                      <td className="p-3 space-x-2">
                        <button
                          onClick={() => openEditModal(prod)}
                          title="Editar"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(prod)}
                          title="Deletar"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Cadastro / Edição */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 px-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-3xl shadow-lg max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{editId ? 'Editar Produto' : 'Cadastrar Produto'}</h3>
                <button
                  onClick={() => setShowModal(false)}
                  aria-label="Fechar modal"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Código */}
                <div>
                  <label htmlFor="code" className="block font-medium mb-1">
                    Código <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="code"
                    type="text"
                    placeholder="Ex: PROD123"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                      formErrors.code ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    autoComplete="off"
                  />
                  {formErrors.code && <p className="text-red-600 mt-1 text-sm">{formErrors.code}</p>}
                </div>

                {/* Nome */}
                <div>
                  <label htmlFor="name" className="block font-medium mb-1">
                    Nome <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Nome do produto"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                      formErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    autoComplete="off"
                  />
                  {formErrors.name && <p className="text-red-600 mt-1 text-sm">{formErrors.name}</p>}
                </div>

                {/* Categoria */}
                <div>
                  <label htmlFor="category" className="block font-medium mb-1">
                    Categoria
                  </label>
                  <input
                    id="category"
                    type="text"
                    placeholder="Ex: Eletrônicos"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoComplete="off"
                  />
                </div>

                {/* Preço e Estoques lado a lado */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Preço */}
                  <div>
                    <label htmlFor="price" className="block font-medium mb-1">
                      Preço (R$) <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="price"
                      type="number"
                      placeholder="Ex: 99.99"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                        formErrors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {formErrors.price && <p className="text-red-600 mt-1 text-sm">{formErrors.price}</p>}
                  </div>

                  {/* Estoque */}
                  <div>
                    <label htmlFor="stock" className="block font-medium mb-1">
                      Estoque <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="stock"
                      type="number"
                      placeholder="Qtd. em estoque"
                      min="0"
                      value={formData.stock}
                      onChange={e => setFormData({ ...formData, stock: e.target.value })}
                      className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                        formErrors.stock ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {formErrors.stock && <p className="text-red-600 mt-1 text-sm">{formErrors.stock}</p>}
                  </div>

                  {/* Estoque Mínimo */}
                  <div>
                    <label htmlFor="min_stock" className="block font-medium mb-1">
                      Estoque Mínimo <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="min_stock"
                      type="number"
                      placeholder="Estoque mínimo"
                      min="0"
                      value={formData.min_stock}
                      onChange={e => setFormData({ ...formData, min_stock: e.target.value })}
                      className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                        formErrors.min_stock ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {formErrors.min_stock && <p className="text-red-600 mt-1 text-sm">{formErrors.min_stock}</p>}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-2 rounded text-white transition-colors ${
                    submitting ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {submitting ? (editId ? 'Atualizando...' : 'Cadastrando...') : editId ? 'Atualizar' : 'Cadastrar'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Inventory;