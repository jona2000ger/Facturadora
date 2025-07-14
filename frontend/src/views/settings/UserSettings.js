import React, { useState } from 'react';
import { useAuth } from '../../controllers/useAuth';
import { useRoles } from '../../controllers/useRoles';
import { useUsers } from '../../controllers/useUsers';
import { 
  Users, 
  Shield, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Save,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AddRoleModal from './components/AddRoleModal';
import AddUserModal from './components/AddUserModal';

const UserSettings = () => {
  const { user } = useAuth();
  const { roles, permissions, isLoading: rolesLoading, saveRole, deleteRole } = useRoles();
  const { users, pagination, isLoading: usersLoading, saveUser, deleteUser, updateUserStatus, refetch: refetchUsers } = useUsers();
  const [activeTab, setActiveTab] = useState('roles');
  const [showAddRole, setShowAddRole] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const getRoleColor = (role) => {
    const roleData = roles.find(r => r.name === role);
    if (!roleData) return 'bg-gray-100 text-gray-800';
    
    switch (roleData.color) {
      case 'red':
        return 'bg-red-100 text-red-800';
      case 'purple':
        return 'bg-purple-100 text-purple-800';
      case 'blue':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role) => {
    const roleData = roles.find(r => r.name === role);
    if (!roleData) return 'Usuario';
    
    switch (role) {
      case 'admin':
        return '👑 ' + roleData.display_name;
      case 'manager':
        return '👨‍💼 ' + roleData.display_name;
      case 'user':
        return '👤 ' + roleData.display_name;
      default:
        return roleData.display_name;
    }
  };

  const handleCreateRole = async (roleData) => {
    try {
      await saveRole(roleData);
      setShowAddRole(false);
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setShowAddRole(true);
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este rol?')) {
      try {
        await deleteRole(roleId);
      } catch (error) {
        console.error('Error deleting role:', error);
      }
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      await saveUser(userData);
      setShowAddUser(false);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowAddUser(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        await deleteUser(userId);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await updateUserStatus(userId, !currentStatus);
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const tabs = [
    { id: 'roles', name: 'Roles y Permisos', icon: Shield },
    { id: 'users', name: 'Gestión de Usuarios', icon: Users },
    { id: 'general', name: 'Configuración General', icon: Settings }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600">Gestiona roles, permisos y usuarios del sistema</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenido de las tabs */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            {/* Header de roles */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Roles y Permisos</h2>
              <button
                onClick={() => {
                  setEditingRole(null);
                  setShowAddRole(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuevo Rol
              </button>
            </div>

            {/* Lista de roles */}
            {rolesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando roles...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles && roles.length > 0 ? (
                  roles.map((role) => (
                    <div key={role.id} className="bg-white shadow-md rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {role.display_name}
                          </h3>
                          <p className="text-sm text-gray-600">{role.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditRole(role)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {role.users_count === 0 && (
                            <button 
                              onClick={() => handleDeleteRole(role.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Usuarios:</span>
                          <span className="font-medium">{role.users_count}</span>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Permisos:</p>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions && role.permissions.length > 0 ? (
                              role.permissions.map((permission) => {
                                const perm = permissions.find(p => p.name === permission);
                                return (
                                  <span key={permission} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                    {perm?.display_name || permission}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-gray-400 text-xs">Sin permisos asignados</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">No hay roles disponibles</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Header de usuarios */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Gestión de Usuarios</h2>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setShowAddUser(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuevo Usuario
              </button>
            </div>

            {/* Tabla de usuarios */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha de registro
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users && users.length > 0 ? (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {user.first_name[0]}{user.last_name[0]}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.first_name} {user.last_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                              {getRoleText(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${
                                user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {user.is_active ? 'Activo' : 'Inactivo'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(user.created_at).toLocaleDateString('es-MX')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleEditUser(user)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          No hay usuarios disponibles
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Configuración General</h2>
            
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Configuración del Sistema</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la empresa
                  </label>
                  <input
                    type="text"
                    defaultValue="Facturadora S.A."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moneda por defecto
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="MXN">Peso Mexicano (MXN)</option>
                    <option value="USD">Dólar Estadounidense (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zona horaria
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                    <option value="America/New_York">Nueva York (GMT-5)</option>
                    <option value="Europe/Madrid">Madrid (GMT+1)</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Guardar Configuración
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Agregar/Editar Rol */}
      <AddRoleModal
        isOpen={showAddRole}
        onClose={() => {
          setShowAddRole(false);
          setEditingRole(null);
        }}
        onSubmit={handleCreateRole}
        permissions={permissions || []}
        isLoading={false}
        editingRole={editingRole}
      />

      {/* Modal de Agregar/Editar Usuario */}
      <AddUserModal
        isOpen={showAddUser}
        onClose={() => {
          setShowAddUser(false);
          setEditingUser(null);
        }}
        onSubmit={handleCreateUser}
        roles={roles || []}
        isLoading={false}
        editingUser={editingUser}
      />
    </div>
  );
};

export default UserSettings; 