import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminInvoices } from '../../controllers/useAdmin';
import { 
  Search, 
  Filter, 
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminInvoiceModal from './AdminInvoiceModal';

const AdminInvoices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    invoices,
    pagination,
    isLoading,
    error,
    updateFilters
  } = useAdminInvoices({
    admin_status: adminStatusFilter,
    status: statusFilter
  });

  // Aplicar filtros cuando cambien
  React.useEffect(() => {
    updateFilters({
      admin_status: adminStatusFilter,
      status: statusFilter
    });
  }, [adminStatusFilter, statusFilter, updateFilters]);

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
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'expired': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  // Filtrar por término de búsqueda localmente
  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner size="lg" className="mt-8" />;
  }

  if (error) {
    return (
      <div className="text-center text-red-600 mt-8">
        Error cargando facturas: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Facturas</h1>
          <p className="text-gray-600">Administración y revisión de facturas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar facturas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>

            {/* Filtro estado administrativo */}
            <select
              value={adminStatusFilter}
              onChange={(e) => setAdminStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">Todos los estados admin</option>
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobada</option>
              <option value="rejected">Rechazada</option>
              <option value="expired">Expirada</option>
            </select>

            {/* Filtro estado general */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="sent">Enviada</option>
              <option value="paid">Pagada</option>
              <option value="cancelled">Cancelada</option>
            </select>

            {/* Botón limpiar filtros */}
            <button
              onClick={() => {
                setSearchTerm('');
                setAdminStatusFilter('');
                setStatusFilter('');
              }}
              className="btn btn-secondary"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de facturas */}
      <div className="card">
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
                  <th>Revisado por</th>
                  <th>Ver</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
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
                      {invoice.admin_reviewer_first_name ? (
                        `${invoice.admin_reviewer_first_name} ${invoice.admin_reviewer_last_name}`
                      ) : (
                        <span className="text-gray-400">No revisado</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewInvoice(invoice)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInvoices.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              {searchTerm || adminStatusFilter || statusFilter 
                ? 'No se encontraron facturas con los filtros aplicados' 
                : 'No hay facturas disponibles'
              }
            </p>
          )}
        </div>
      </div>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              disabled={pagination.page === 1}
              className="btn btn-secondary disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page === pagination.totalPages}
              className="btn btn-secondary disabled:opacity-50"
            >
              Siguiente
            </button>
          </nav>
        </div>
      )}

      {/* Modal de detalles */}
      {isModalOpen && selectedInvoice && (
        <AdminInvoiceModal
          invoice={selectedInvoice}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedInvoice(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminInvoices; 