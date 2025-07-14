import React, { useState } from 'react';
import { useAuth } from '../../controllers/useAuth';
import { User, Shield, Settings, Package, FileText, Users, Home } from 'lucide-react';

const RoleTester = () => {
  const { user, logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState(user?.role || 'admin');

  const roles = [
    {
      name: 'admin',
      displayName: '👑 Administrador',
      description: 'Acceso completo al sistema',
      permissions: ['dashboard', 'invoices', 'clients', 'products', 'admin', 'users', 'settings'],
      color: 'bg-red-100 text-red-800'
    },
    {
      name: 'manager',
      displayName: '👨‍💼 Gerente',
      description: 'Gestión de facturas, clientes y productos',
      permissions: ['dashboard', 'invoices', 'clients', 'products', 'reports'],
      color: 'bg-purple-100 text-purple-800'
    },
    {
      name: 'user',
      displayName: '👤 Usuario',
      description: 'Acceso básico al sistema',
      permissions: ['dashboard', 'invoices', 'clients', 'products'],
      color: 'bg-blue-100 text-blue-800'
    }
  ];

  const currentRole = roles.find(r => r.name === selectedRole);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    // Simular cambio de rol
    const mockUsers = {
      admin: {
        id: '1',
        email: 'admin@example.com',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        role_id: 1
      },
      manager: {
        id: '2',
        email: 'manager@example.com',
        first_name: 'Manager',
        last_name: 'User',
        role: 'manager',
        role_id: 2
      },
      user: {
        id: '3',
        email: 'user@example.com',
        first_name: 'Regular',
        last_name: 'User',
        role: 'user',
        role_id: 3
      }
    };

    const newUser = mockUsers[role];
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('userRole', role);
    
    // Recargar la página para aplicar los cambios
    window.location.reload();
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'dashboard':
        return <Home size={16} />;
      case 'invoices':
        return <FileText size={16} />;
      case 'clients':
        return <Users size={16} />;
      case 'products':
        return <Package size={16} />;
      case 'admin':
        return <Shield size={16} />;
      case 'users':
        return <User size={16} />;
      case 'settings':
        return <Settings size={16} />;
      default:
        return <Shield size={16} />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Probador de Roles</h2>
        <p className="text-gray-600">Cambia entre diferentes roles para probar los permisos</p>
      </div>

      {/* Selector de roles */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Rol:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((role) => (
            <button
              key={role.name}
              onClick={() => handleRoleChange(role.name)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedRole === role.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{role.displayName.split(' ')[0]}</div>
                <div className="font-medium text-gray-900">{role.displayName.split(' ').slice(1).join(' ')}</div>
                <div className="text-sm text-gray-600 mt-1">{role.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Información del rol actual */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Rol Actual: {currentRole?.displayName}</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Permisos disponibles:</h4>
          <div className="flex flex-wrap gap-2">
            {currentRole?.permissions.map((permission) => (
              <span
                key={permission}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
              >
                {getPermissionIcon(permission)}
                {permission}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Navegación disponible */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Navegación disponible:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentRole?.permissions.map((permission) => {
            const navigationItem = getNavigationItem(permission);
            if (!navigationItem) return null;
            
            return (
              <div
                key={permission}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
              >
                {navigationItem.icon}
                <div>
                  <div className="font-medium text-gray-900">{navigationItem.name}</div>
                  <div className="text-sm text-gray-600">{navigationItem.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Acciones disponibles */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Acciones disponibles:</h3>
        <div className="space-y-2">
          {currentRole?.permissions.includes('dashboard') && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Home size={16} className="text-green-500" />
              Ver dashboard principal
            </div>
          )}
          {currentRole?.permissions.includes('clients') && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Users size={16} className="text-green-500" />
                Gestionar clientes (crear, editar, ver)
              </div>
            </>
          )}
          {currentRole?.permissions.includes('products') && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Package size={16} className="text-green-500" />
                Gestionar productos (crear, editar, ver)
              </div>
            </>
          )}
          {currentRole?.permissions.includes('invoices') && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <FileText size={16} className="text-green-500" />
                Gestionar facturas (crear, editar, ver, enviar, pagar)
              </div>
            </>
          )}
          {currentRole?.permissions.includes('admin') && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Shield size={16} className="text-green-500" />
                Acceso a dashboard administrativo
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Shield size={16} className="text-green-500" />
                Revisar y aprobar facturas
              </div>
            </>
          )}
          {currentRole?.permissions.includes('users') && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User size={16} className="text-green-500" />
                Gestionar usuarios del sistema
              </div>
            </>
          )}
          {currentRole?.permissions.includes('settings') && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Settings size={16} className="text-green-500" />
                Configuración del sistema
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const getNavigationItem = (permission) => {
  switch (permission) {
    case 'dashboard':
      return {
        name: 'Dashboard',
        description: 'Panel principal',
        icon: <Home size={20} className="text-blue-500" />
      };
    case 'clients':
      return {
        name: 'Clientes',
        description: 'Gestión de clientes',
        icon: <Users size={20} className="text-green-500" />
      };
    case 'products':
      return {
        name: 'Productos',
        description: 'Gestión de productos',
        icon: <Package size={20} className="text-purple-500" />
      };
    case 'invoices':
      return {
        name: 'Facturas',
        description: 'Gestión de facturas',
        icon: <FileText size={20} className="text-orange-500" />
      };
    case 'admin':
      return {
        name: 'Administración',
        description: 'Funciones administrativas',
        icon: <Shield size={20} className="text-red-500" />
      };
    case 'users':
      return {
        name: 'Usuarios',
        description: 'Gestión de usuarios',
        icon: <User size={20} className="text-indigo-500" />
      };
    case 'settings':
      return {
        name: 'Configuración',
        description: 'Configuración del sistema',
        icon: <Settings size={20} className="text-gray-500" />
      };
    default:
      return null;
  }
};

export default RoleTester; 