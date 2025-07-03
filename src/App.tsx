import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  NavLink,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import {
  Menu,
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Users,
  Truck,
  Settings,
} from "lucide-react";

import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Settings_ from "./pages/Settings";

import Login from "./pages/Login";

function App() {
  // Sidebar aberto ou fechado
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  // Autenticação do usuário
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  // Mensagem de erro geral de autenticação
  const [authError, setAuthError] = useState<string | null>(null);
  // Estado para indicar se a verificação de token está em andamento
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  const location = useLocation();
  const navigate = useNavigate();

  // Verifica token no localStorage para definir autenticação ao montar o app
  useEffect(() => {
    setLoadingAuth(true);
    try {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
      setAuthError(null);
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      setAuthError(
        "Erro ao verificar autenticação. Por favor, recarregue a página."
      );
      setIsAuthenticated(false);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  // Função para login - armazenar token e atualizar estado
  const handleLogin = (token: string) => {
    try {
      localStorage.setItem("token", token);
      setIsAuthenticated(true);
      setAuthError(null);
      navigate("/"); // Redireciona para dashboard após login
    } catch (error) {
      console.error("Erro ao salvar token:", error);
      setAuthError("Erro interno ao fazer login. Tente novamente.");
    }
  };

  // Função simples para logout - limpa token e estado
  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      setIsAuthenticated(false);
      setAuthError(null);
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      setAuthError("Erro interno ao fazer logout. Tente novamente.");
    }
  };

  // Enquanto verifica autenticação, exibe loading
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Carregando...</p>
      </div>
    );
  }

  // Se não autenticado e não está na rota de login, redireciona para login
  if (!isAuthenticated && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {/* Mensagem de erro fixa no topo, se houver */}
      {authError && (
        <div
          className="fixed top-0 left-0 w-full bg-red-600 text-white p-3 text-center z-50"
          role="alert"
          aria-live="assertive"
        >
          {authError}
        </div>
      )}

      <Routes>
        {/* Rota pública para login */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />

        {/* Rotas privadas */}
        {isAuthenticated && (
          <Route
            path="/*"
            element={
              <div className="min-h-screen bg-gray-50 flex">
                {/* Sidebar */}
                <aside
                  className={`${
                    isSidebarOpen ? "w-64" : "w-20"
                  } bg-white border-r border-gray-200 transition-all duration-300 ease-in-out`}
                  aria-label="Sidebar principal"
                >
                  <div className="p-4 flex items-center justify-between border-b border-gray-200">
                    <h1
                      className={`font-bold text-xl text-blue-600 ${
                        !isSidebarOpen ? "hidden" : ""
                      }`}
                    >
                      VendaSys
                    </h1>
                    <button
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label={isSidebarOpen ? "Fechar sidebar" : "Abrir sidebar"}
                      aria-expanded={isSidebarOpen}
                    >
                      <Menu className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <nav className="p-4" role="navigation" aria-label="Menu principal">
                    {[
                      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
                      { icon: ShoppingCart, label: "Vendas", path: "/vendas" },
                      { icon: Package, label: "Estoque", path: "/estoque" },
                      { icon: FileText, label: "Relatórios", path: "/relatorios" },
                      { icon: Users, label: "Clientes", path: "/clientes" },
                      { icon: Truck, label: "Fornecedores", path: "/fornecedores" },
                      { icon: Settings, label: "Configurações", path: "/configuracoes" },
                    ].map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center space-x-3 p-3 rounded-lg mb-1 transition-colors ${
                            isActive
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-600 hover:bg-gray-100"
                          }`
                        }
                        aria-current={({ isActive }) => (isActive ? "page" : undefined)}
                      >
                        <item.icon className="w-5 h-5" aria-hidden="true" />
                        {isSidebarOpen && <span>{item.label}</span>}
                      </NavLink>
                    ))}

                    {/* Botão logout */}
                    <button
                      onClick={handleLogout}
                      className="mt-4 w-full text-left text-red-600 hover:bg-red-100 p-2 rounded"
                      aria-label="Sair do sistema"
                    >
                      Sair
                    </button>
                  </nav>
                </aside>

                {/* Conteúdo principal */}
                <main className="flex-1 overflow-auto">
                  <div className="p-8">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/vendas" element={<Sales />} />
                      <Route path="/estoque" element={<Inventory />} />
                      <Route path="/relatorios" element={<Reports />} />
                      <Route path="/clientes" element={<Customers />} />
                      <Route path="/fornecedores" element={<Suppliers />} />
                      <Route path="/configuracoes" element={<Settings_ />} />
                      {/* Rota coringa para 404 */}
                      <Route
                        path="*"
                        element={
                          <h2 className="text-center text-gray-600 mt-20">
                            Página não encontrada
                          </h2>
                        }
                      />
                    </Routes>
                  </div>
                </main>
              </div>
            }
          />
        )}
      </Routes>
    </>
  );
}

export default App;
