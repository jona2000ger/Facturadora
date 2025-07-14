import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminDashboard } from '../../controllers/useAdmin';
import { useAdminInvoices } from '../../controllers/useAdmin';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Users,
  RefreshCw,
  Eye,
  Settings
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import AdminInvoiceModal from './AdminInvoiceModal';

const AdminDashboard = () => {
  const { data: dashboardData, isLoading, error, refetch } = useAdminDashboard();
  const [lastUpdate, setLastUpdate] = React.useState(new Date());
  
  // Hook para acciones administrativas
  const { updateInvoiceStatus, updateLoading } = useAdminInvoices();

  // Estado para el modal de previsualización
  const [selectedInvoice, setSelectedInvoice] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleRefresh = () => {
    refetch();
    setLastUpdate(new Date());
  };

  const handleStatusUpdate = (invoiceId, newStatus) => {
    const notes = prompt('Ingrese notas administrativas (opcional):');
    if (notes !== null) { // Solo si no se canceló el prompt
      updateInvoiceStatus(invoiceId, newStatus, notes || '');
    }
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="mt-8" />;
  }

  if (error) {
    return (
      <div className="text-center text-red-600 mt-8">
        Error cargando dashboard: {error.message}
      </div>
    );
  }

  const { adminStatusStats, statusStats, recentInvoices, totals } = dashboardData;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getInvoiceStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInvoiceStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return '✓ Pagada';
      case 'sent':
        return '⏳ Pendiente';
      case 'draft':
        return '📝 Borrador';
      case 'cancelled':
        return '❌ Cancelada';
      default:
        return status || 'Desconocido';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5" />;
      case 'approved': return <CheckCircle className="h-5 w-5" />;
      case 'rejected': return <XCircle className="h-5 w-5" />;
      case 'expired': return <AlertTriangle className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Administración</h1>
          <p className="text-gray-600">Resumen general del sistema de facturación</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/admin/invoices"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Gestión de Facturas
          </Link>
          <div className="text-sm text-gray-500">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refrescar
          </button>
        </div>
      </div>

      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Facturas</p>
                <p className="text-2xl font-semibold text-gray-900">{totals?.total_invoices || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Monto Total</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(totals?.total_amount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Aprobadas</p>
                <p className="text-2xl font-semibold text-gray-900">{totals?.approved_count || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pendientes</p>
                <p className="text-2xl font-semibold text-gray-900">{totals?.pending_count || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas por estado administrativo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Estados Administrativos</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {adminStatusStats?.map((stat) => (
                <div key={stat.admin_status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(stat.admin_status)}`}>
                      {getStatusIcon(stat.admin_status)}
                      <span className="ml-1 capitalize">{stat.admin_status}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{stat.count}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(stat.total_amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Estados Generales</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {statusStats?.map((stat) => (
                <div key={stat.status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInvoiceStatusColor(stat.status)}`}>
                      <span className="ml-1">{getInvoiceStatusText(stat.status)}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{stat.count}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(stat.total_amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Facturas recientes */}
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Facturas Recientes</h3>
            <Link
              to="/admin/invoices"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver todas →
            </Link>
          </div>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th>Monto</th>
                  <th>Estado Admin</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices?.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="font-medium">{invoice.invoice_number}</td>
                    <td>{invoice.client_name}</td>
                    <td>{formatCurrency(invoice.total_amount)}</td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.admin_status)}`}>
                        {getStatusIcon(invoice.admin_status)}
                        <span className="ml-1 capitalize">{invoice.admin_status}</span>
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInvoiceStatusColor(invoice.status)}`}>
                        <span className="ml-1">{getInvoiceStatusText(invoice.status)}</span>
                      </span>
                    </td>
                    <td>{new Date(invoice.created_at).toLocaleDateString('es-MX')}</td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {/* Botones de estado administrativo */}
                        {invoice.admin_status !== 'approved' && (
                          <button
                            onClick={() => handleStatusUpdate(invoice.id, 'approved')}
                            disabled={updateLoading}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            title="Aprobar"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        {invoice.admin_status !== 'rejected' && (
                          <button
                            onClick={() => handleStatusUpdate(invoice.id, 'rejected')}
                            disabled={updateLoading}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Rechazar"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        {invoice.admin_status !== 'expired' && (
                          <button
                            onClick={() => handleStatusUpdate(invoice.id, 'expired')}
                            disabled={updateLoading}
                            className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                            title="Marcar como expirada"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recentInvoices?.length === 0 && (
            <p className="text-center text-gray-500 py-4">No hay facturas recientes</p>
          )}
        </div>
      </div>

      {/* Modal de previsualización */}
      {isModalOpen && selectedInvoice && (
        <AdminInvoiceModal
          invoice={selectedInvoice}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};

export default AdminDashboard; 