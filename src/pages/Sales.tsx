import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, X } from 'lucide-react';

interface Product {
  id: string; // Alterado de number para string para compatibilidade com o UUID
  name: string;
  price: number;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

function Sales() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [customerId, setCustomerId] = useState(''); // Novo estado para cliente

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/products');
      if (!res.ok) throw new Error('Erro ao carregar produtos');
      const data = await res.json();

      const normalized = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price),
        stock: parseInt(p.stock),
      }));

      setProducts(normalized);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          return currentCart.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          alert('Quantidade máxima em estoque atingida');
          return currentCart;
        }
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(currentCart => currentCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || newQuantity < 1 || newQuantity > product.stock) return;

    setCart(currentCart =>
      currentCart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function finalizeSale() {
    if (cart.length === 0) return;

    setFinalizing(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:3001/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(({ id, quantity }) => ({ id, quantity })),
          paymentMethod,
          customer_id: customerId || null // Envia o ID do cliente ou null
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao finalizar venda');
      }

      setCart([]);
      setPaymentMethod('dinheiro');
      setCustomerId(''); // Limpa o campo do cliente
      fetchProducts(); // Atualiza o estoque
      setShowSuccessModal(true); // Mostra popup
    } catch (err) {
      console.error('Erro ao finalizar venda:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setFinalizing(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Vendas</h2>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produtos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <p className="p-4 text-center text-gray-500">Carregando...</p>
            ) : filteredProducts.length === 0 ? (
              <p className="p-4 text-center text-gray-500">Nenhum produto encontrado.</p>
            ) : (
              filteredProducts.map(product => (
                <div key={product.id} className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">Estoque: {product.stock}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-gray-900">
                      R$ {product.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => addToCart(product)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      disabled={cart.find(item => item.id === product.id)?.quantity === product.stock}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Carrinho */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-fit">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-gray-500" />
              <h3 className="font-medium text-gray-900">Carrinho</h3>
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
            {cart.length === 0 ? (
              <p className="p-4 text-center text-gray-500">Carrinho vazio.</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">R$ {item.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 rounded-md hover:bg-gray-100"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 rounded-md hover:bg-gray-100"
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagamento + Finalizar */}
          <div className="p-4 border-t border-gray-100 space-y-4">
            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">Cliente (opcional)</label>
              <input
                type="text"
                placeholder="ID do cliente"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">Método de Pagamento</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="cartao">Cartão</option>
              </select>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Total:</span>
              <span className="text-lg font-bold text-gray-900">
                R$ {total.toFixed(2)}
              </span>
            </div>
            <button
              className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={cart.length === 0 || finalizing}
              onClick={finalizeSale}
            >
              {finalizing ? 'Finalizando...' : 'Finalizar Venda'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-green-600">Venda Finalizada</h3>
              <button onClick={() => setShowSuccessModal(false)}>
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <p className="text-gray-700 mb-4">A venda foi registrada com sucesso no sistema.</p>
            <button
              className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              onClick={() => setShowSuccessModal(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;