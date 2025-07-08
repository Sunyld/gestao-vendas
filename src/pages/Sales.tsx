import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, X, ArchiveRestore, ArchiveX, CheckCircle, AlertCircle } from 'lucide-react';

interface Product {
  id: string;
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
  const [receivedAmount, setReceivedAmount] = useState<number | ''>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archivedCarts, setArchivedCarts] = useState<CartItem[][]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [archiveMessage, setArchiveMessage] = useState<{type: string, text: string} | null>(null);

  useEffect(() => {
    fetchProducts();
    const localCarts = localStorage.getItem('archivedCarts');
    if (localCarts) {
      const parsedCarts = JSON.parse(localCarts);
      setArchivedCarts(parsedCarts);
      setNotificationCount(parsedCarts.length);
    }
  }, []);

  function updateArchivedCarts(carts: CartItem[][]) {
    setArchivedCarts(carts);
    setNotificationCount(carts.length);
    localStorage.setItem('archivedCarts', JSON.stringify(carts));
  }

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
  const troco = paymentMethod === 'dinheiro' && typeof receivedAmount === 'number'
    ? receivedAmount - total
    : null;

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
          customer_id: customerId || null
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao finalizar venda');
      }

      setCart([]);
      setPaymentMethod('dinheiro');
      setReceivedAmount('');
      setCustomerId('');
      fetchProducts();
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Erro ao finalizar venda:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setFinalizing(false);
    }
  }

  function archiveCart() {
    if (cart.length > 0) {
      const newArchive = [...archivedCarts, cart];
      updateArchivedCarts(newArchive);
      setCart([]);
      setArchiveMessage({type: 'success', text: 'Carrinho arquivado com sucesso!'});
      setTimeout(() => setArchiveMessage(null), 3000);
    }
  }

  function restoreCart(index: number) {
    const toRestore = archivedCarts[index];
    setCart(toRestore);
    const updated = [...archivedCarts];
    updated.splice(index, 1);
    updateArchivedCarts(updated);
    setShowArchiveModal(false);
    setArchiveMessage({type: 'success', text: 'Carrinho restaurado com sucesso!'});
    setTimeout(() => setArchiveMessage(null), 3000);
  }

  function clearArchivedCarts() {
    updateArchivedCarts([]);
    setArchiveMessage({type: 'info', text: 'Carrinhos esvaziados com sucesso!'});
    setTimeout(() => setArchiveMessage(null), 3000);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Vendas</h2>
        <button
          onClick={() => setShowArchiveModal(true)}
          className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md relative"
        >
          <ArchiveRestore className="w-4 h-4" />
          <span className="text-sm">Carrinhos Arquivados</span>
          {notificationCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>
      </div>

      {archiveMessage && (
        <div className={`p-3 rounded-md flex items-center space-x-2 ${
          archiveMessage.type === 'success' ? 'bg-green-100 text-green-800' : 
          archiveMessage.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {archiveMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{archiveMessage.text}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <p className="p-4 text-center text-gray-500 col-span-full">Carregando...</p>
            ) : filteredProducts.length === 0 ? (
              <p className="p-4 text-center text-gray-500 col-span-full">Nenhum produto encontrado.</p>
            ) : (
              filteredProducts.map(product => (
                <div key={product.id} className="bg-white border rounded-xl p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">Estoque: {product.stock}</p>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="font-bold text-gray-900">R$ {product.price.toFixed(2)}</span>
                    <button
                      onClick={() => addToCart(product)}
                      className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
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
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-gray-500" />
              <h3 className="font-medium text-gray-900">Carrinho</h3>
              {cart.length > 0 && (
                <span className="text-xs bg-blue-500 text-white rounded-full px-2 py-1">
                  {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                </span>
              )}
            </div>
            <button
              onClick={archiveCart}
              className="text-sm text-blue-500 hover:underline flex items-center space-x-1"
              disabled={cart.length === 0}
            >
              <ArchiveRestore className="w-4 h-4" />
              <span>Arquivar</span>
            </button>
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
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 rounded-md hover:bg-gray-100" disabled={item.quantity <= 1}>
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded-md hover:bg-gray-100" disabled={item.quantity >= item.stock}>
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-100 space-y-4">
            {paymentMethod === 'dinheiro' && (
              <div>
                <label className="text-sm text-gray-600 font-medium mb-1 block">Valor Recebido</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="0,00"
                  value={receivedAmount === '' ? '' : receivedAmount}
                  onChange={e => setReceivedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                />
                {troco !== null && troco >= 0 && (
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Troco: R$ {troco.toFixed(2)}
                  </p>
                )}
              </div>
            )}

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
              <span className="text-lg font-bold text-gray-900">R$ {total.toFixed(2)}</span>
            </div>

            <button
              className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              disabled={cart.length === 0 || finalizing}
              onClick={finalizeSale}
            >
              {finalizing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Finalizando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Finalizar Venda</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-green-600 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Venda Finalizada</span>
              </h3>
              <button onClick={() => setShowSuccessModal(false)}>
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <p className="text-gray-700 mb-4">A venda foi registrada com sucesso no sistema.</p>
            <button
              className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center space-x-2"
              onClick={() => setShowSuccessModal(false)}
            >
              <X className="w-4 h-4" />
              <span>Fechar</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal de Carrinhos Arquivados */}
      {showArchiveModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <ArchiveRestore className="w-5 h-5" />
                <span>Carrinhos Arquivados</span>
              </h3>
              <button onClick={() => setShowArchiveModal(false)}>
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            
            {archivedCarts.length === 0 ? (
              <div className="text-center py-8">
                <ArchiveX className="w-10 h-10 mx-auto text-gray-400" />
                <p className="text-gray-600 mt-2">Nenhum carrinho arquivado.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {archivedCarts.map((cart, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                          <ShoppingCart className="w-4 h-4 text-gray-500" />
                          <span>Carrinho #{index + 1}</span>
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {cart.length} {cart.length === 1 ? 'item' : 'itens'} • Total: R$ {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => restoreCart(index)}
                        className="text-sm text-blue-600 hover:underline flex items-center space-x-1"
                      >
                        <ArchiveRestore className="w-4 h-4" />
                        <span>Restaurar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {archivedCarts.length > 0 && (
              <button
                onClick={clearArchivedCarts}
                className="text-sm text-red-500 hover:underline flex items-center space-x-1 w-full justify-center py-2 border border-red-100 rounded-lg hover:bg-red-50"
              >
                <ArchiveX className="w-4 h-4" />
                <span>Esvaziar tudo</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;