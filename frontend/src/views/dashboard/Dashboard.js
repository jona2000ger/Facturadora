import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../controllers/useAuth';
import { useDashboard } from '../../controllers/useDashboard';
import { 
  Users, 
  Package, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import RoleTester from '../components/RoleTester';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    dashboardData, 
    isLoading, 
    error, 
    refetch 
  } = useDashboard();

  console.log('Dashboard Component - dashboardData:', dashboardData);

  const stats = [
    {
      name: 'Total Clientes',
      value: dashboardData?.totalClients || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Total Productos',
      value: dashboardData?.totalProducts || 0,
      icon: Package,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Total Facturas',
      value: dashboardData?.totalInvoices || 0,
      icon: FileText,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'positive'
    },
    {
      name: 'Ingresos Totales',
      value: `$${(dashboardData?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+23%',
      changeType: 'positive'
    }
  ];

  const handleRefresh = async () => {
    console.log('Refreshing dashboard...');
    try {
      await refetch();
      console.log('Dashboard refreshed successfully');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    }
  };

  const handleNewClient = () => {
    navigate('/clients/new');
  };

  const handleNewInvoice = () => {
    navigate('/invoices/new');
  };

  const handleNewProduct = () => {
    navigate('/products/new');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error al cargar el dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Bienvenido, {user?.first_name} {user?.last_name}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {stat.changeType === 'positive' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`ml-2 text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="ml-2 text-sm text-gray-600">desde el mes pasado</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleNewClient}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Users className="h-6 w-6 text-blue-500" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Nuevo Cliente</p>
              <p className="text-sm text-gray-600">Agregar cliente</p>
            </div>
          </button>
          <button 
            onClick={handleNewInvoice}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <FileText className="h-6 w-6 text-purple-500" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Nueva Factura</p>
              <p className="text-sm text-gray-600">Crear factura</p>
            </div>
          </button>
          <button 
            onClick={handleNewProduct}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Package className="h-6 w-6 text-green-500" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Nuevo Producto</p>
              <p className="text-sm text-gray-600">Agregar producto</p>
            </div>
          </button>
        </div>
      </div>

      {/* Role Tester - Solo mostrar si es admin */}
      {user?.role === 'admin' && (
        <RoleTester />
      )}
    </div>
  );
};

export default Dashboard; 