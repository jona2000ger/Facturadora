import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, FileText, Calendar, DollarSign, Send } from 'lucide-react';
import { useInvoices } from '../../controllers/useInvoices';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { invoices, isLoading, sendInvoice, refetchInvoices } = useInvoices();

  const filteredInvoices = invoices?.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.status.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
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

  const getStatusText = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return '✓ Pagada';
      case 'sent':
        return '⏳ Pendiente';
      case 'draft':
        return '📝 Borrador';
      case 'cancelled':
        return '❌ Cancelada';
      default:
        return status;
    }
  };

  const getAdminStatusColor = (adminStatus) => {
    switch (adminStatus) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getAdminStatusText = (adminStatus) => {
    switch (adminStatus) {
      case 'pending':
        return '⏳ Esperando Aprobación';
      case 'approved':
        return '✅ Aprobada';
      case 'rejected':
        return '❌ Rechazada';
      case 'expired':
        return '⏰ Expirada';
      default:
        return '📋 Pendiente';
    }
  };

  const canSendInvoice = (invoice) => {
    return invoice.status === 'draft' && invoice.admin_status === 'approved';
  };

  const getSendButtonText = (invoice) => {
    if (invoice.status !== 'draft') {
      return 'No se puede enviar';
    }
    
    switch (invoice.admin_status) {
      case 'pending':
        return 'Esperando Aprobación';
      case 'rejected':
        return 'Rechazada';
      case 'expired':
        return 'Expirada';
      case 'approved':
        return 'Enviar';
      default:
        return 'Pendiente';
    }
  };

  const getSendButtonDisabled = (invoice) => {
    return !canSendInvoice(invoice);
  };

  const getSendButtonColor = (invoice) => {
    if (canSendInvoice(invoice)) {
      return 'text-blue-600 hover:text-blue-900';
    }
    return 'text-gray-400 cursor-not-allowed';
  };

  const handleSendInvoice = async (invoiceId) => {
    try {
      await sendInvoice(invoiceId);
      await refetchInvoices();
    } catch (error) {
      toast.error(error.message || 'Error al enviar la factura');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Facturas</h1>
        <Link
          to="/invoices/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nueva Factura
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar facturas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Factura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado Admin
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.items_count || 0} items
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.client_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {invoice.client_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {formatDate(invoice.issue_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {formatDate(invoice.due_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                      {formatPrice(invoice.total_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                      {getStatusText(invoice.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAdminStatusColor(invoice.admin_status)}`}>
                      {getAdminStatusText(invoice.admin_status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => handleSendInvoice(invoice.id)}
                          className={`${getSendButtonColor(invoice)}`}
                          title={getSendButtonText(invoice)}
                          disabled={getSendButtonDisabled(invoice)}
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredInvoices.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron facturas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices; 