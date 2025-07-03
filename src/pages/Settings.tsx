import React, { useState, useEffect } from 'react';
import {
  Save, Building, Mail, Phone, MapPin, CreditCard, Bell, Shield, Printer, UserPlus, Trash2, Edit
} from 'lucide-react';

function Settings() {
  const [activeTab, setActiveTab] = useState('empresa');
  const [formData, setFormData] = useState({
    companyName: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    logo: null
  });

  const [userData, setUserData] = useState({
    id: null,
    name: '',
    email: '',
    password: '',
    role: 'caixa'
  });

  const [users, setUsers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Função para buscar todos os usuários
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/users', {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Erro ao buscar usuários');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      alert('Erro ao buscar usuários');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar usuários ao montar o componente ou mudar para a aba "usuarios"
  useEffect(() => {
    if (activeTab === 'usuarios') {
      fetchUsers();
    }
  }, [activeTab]);

  // Função para submissão de dados da empresa (mantida como está)
  const handleCompanySubmit = (e) => {
    e.preventDefault();
    alert('Configurações da empresa serão salvas em breve!');
  };

  // Função para criar ou atualizar usuário
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditing
        ? `http://localhost:3001/api/users/${userData.id}`
        : 'http://localhost:3001/api/users';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password || undefined, // Não enviar senha vazia no modo edição
          role: userData.role
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 409) {
          throw new Error('E-mail já cadastrado');
        } else if (res.status === 404) {
          throw new Error('Usuário não encontrado');
        } else {
          throw new Error(errorData.message || 'Erro ao salvar usuário');
        }
      }

      alert(isEditing ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!');
      setUserData({ id: null, name: '', email: '', password: '', role: 'caixa' });
      setIsEditing(false);
      fetchUsers(); // Atualizar lista de usuários
    } catch (err) {
      alert(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Função para selecionar usuário para edição
  const handleEditUser = (user) => {
    setUserData({
      id: user.id,
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    });
    setIsEditing(true);
  };

  // Função para excluir usuário
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 400) {
          throw new Error('Não é possível excluir o usuário porque ele possui vendas registradas');
        } else if (res.status === 404) {
          throw new Error('Usuário não encontrado');
        } else {
          throw new Error(errorData.message || 'Erro ao excluir usuário');
        }
      }

      alert('Usuário excluído com sucesso!');
      fetchUsers(); // Atualizar lista de usuários
    } catch (err) {
      alert(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Função para cancelar edição
  const handleCancelEdit = () => {
    setUserData({ id: null, name: '', email: '', password: '', role: 'caixa' });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200">
            <nav className="p-4 space-y-1">
              {[
                { key: 'empresa', label: 'Dados da Empresa', icon: <Building className="w-5 h-5" /> },
                { key: 'fiscal', label: 'Configurações Fiscais', icon: <CreditCard className="w-5 h-5" /> },
                { key: 'notificacoes', label: 'Notificações', icon: <Bell className="w-5 h-5" /> },
                { key: 'seguranca', label: 'Segurança', icon: <Shield className="w-5 h-5" /> },
                { key: 'impressao', label: 'Impressão', icon: <Printer className="w-5 h-5" /> },
                { key: 'usuarios', label: 'Usuários', icon: <UserPlus className="w-5 h-5" /> }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.key ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 p-6">
            {/* Empresa */}
            {activeTab === 'empresa' && (
              <form onSubmit={handleCompanySubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo da Empresa
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">Logo</span>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Alterar Logo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </form>
            )}

            {/* Usuários */}
            {activeTab === 'usuarios' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {isEditing ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
                </h3>

                <form onSubmit={handleUserSubmit} className="space-y-6 max-w-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        value={userData.name}
                        onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        value={userData.email}
                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isEditing ? 'Nova Senha (opcional)' : 'Senha'}
                      </label>
                      <input
                        type="password"
                        required={!isEditing}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        value={userData.password}
                        onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        value={userData.role}
                        onChange={(e) => setUserData({ ...userData, role: e.target.value })}
                      >
                        <option value="caixa">Caixa</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white ${
                        isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Save className="w-4 h-4" />
                      <span>{isEditing ? 'Atualizar Usuário' : 'Cadastrar Usuário'}</span>
                    </button>
                  </div>
                </form>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Lista de Usuários</h3>
                  {loading ? (
                    <p className="text-gray-500">Carregando usuários...</p>
                  ) : users.length === 0 ? (
                    <p className="text-gray-500">Nenhum usuário encontrado.</p>
                  ) : (
                    <div className="overflow-auto max-h-[400px]">
                      <table className="w-full text-sm text-left border border-gray-200">
                        <thead className="bg-gray-50 text-gray-600 font-semibold">
                          <tr>
                            <th className="px-4 py-2">Nome</th>
                            <th className="px-4 py-2">Email</th>
                            <th className="px-4 py-2">Cargo</th>
                            <th className="px-4 py-2">Data de Criação</th>
                            <th className="px-4 py-2">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id} className="border-t">
                              <td className="px-4 py-2">{user.name}</td>
                              <td className="px-4 py-2">{user.email}</td>
                              <td className="px-4 py-2">{user.role === 'admin' ? 'Administrador' : 'Caixa'}</td>
                              <td className="px-4 py-2">
                                {new Date(user.created_at).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEditUser(user)}
                                    className="p-1 text-blue-600 hover:text-blue-800"
                                    title="Editar"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-1 text-red-600 hover:text-red-800"
                                    title="Excluir"
                                    disabled={loading}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Outras abas em construção */}
            {activeTab !== 'empresa' && activeTab !== 'usuarios' && (
              <div className="flex items-center justify-center h-64 text-gray-500">
                Em desenvolvimento...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;