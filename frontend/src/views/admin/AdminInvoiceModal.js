import React, { useState } from 'react';
import { useAdminInvoice } from '../../controllers/useAdmin';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Download
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';

const AdminInvoiceModal = ({ invoice, isOpen, onClose, onStatusUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const { data: fullInvoice, isLoading } = useAdminInvoice(invoice.id);

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  const handleDownloadPDF = async () => {
    if (!fullInvoice) return;
    
    setIsGeneratingPDF(true);
    toast.loading('Generando PDF...', { id: 'pdf-generation' });
    
    try {
      // Crear un elemento temporal para el PDF
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.top = '0';
      pdfContainer.style.width = '800px';
      pdfContainer.style.backgroundColor = 'white';
      pdfContainer.style.padding = '40px';
      pdfContainer.style.fontFamily = 'Arial, sans-serif';
      pdfContainer.style.fontSize = '12px';
      pdfContainer.style.lineHeight = '1.4';
      
      pdfContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px; color: #333;">FACTURA</h1>
          <h2 style="margin: 10px 0 0 0; font-size: 20px; color: #666;">${fullInvoice.invoice_number}</h2>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Empresa</h3>
          <p style="margin: 5px 0;"><strong>Facturadora S.A.</strong></p>
          <p style="margin: 5px 0;">Dirección de la empresa</p>
          <p style="margin: 5px 0;">RFC: XXX-000000-XX1</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Información de la Factura</h3>
          <p style="margin: 5px 0;"><strong>Número:</strong> ${fullInvoice.invoice_number}</p>
          <p style="margin: 5px 0;"><strong>Fecha de emisión:</strong> ${formatDate(fullInvoice.issue_date)}</p>
          <p style="margin: 5px 0;"><strong>Fecha de vencimiento:</strong> ${formatDate(fullInvoice.due_date)}</p>
          <p style="margin: 5px 0;"><strong>Estado:</strong> ${getInvoiceStatusText(fullInvoice.status)}</p>
          <p style="margin: 5px 0;"><strong>Estado Administrativo:</strong> ${fullInvoice.admin_status}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Información del Cliente</h3>
          <p style="margin: 5px 0;"><strong>Nombre:</strong> ${fullInvoice.client_name}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${fullInvoice.client_email}</p>
          <p style="margin: 5px 0;"><strong>Teléfono:</strong> ${fullInvoice.client_phone || 'No especificado'}</p>
          <p style="margin: 5px 0;"><strong>Dirección:</strong> ${fullInvoice.client_address || 'No especificada'}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #ddd;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Descripción</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Cantidad</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Precio Unitario</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${fullInvoice.items?.map(item => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px;">${item.description}</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${item.quantity}</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${formatCurrency(item.unit_price)}</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${formatCurrency(item.quantity * item.unit_price)}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>

        <div style="margin-top: 30px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="text-align: right; padding: 8px; border: none;"><strong>Subtotal:</strong></td>
              <td style="padding: 8px; border: none;">${formatCurrency(fullInvoice.subtotal)}</td>
            </tr>
            <tr>
              <td style="text-align: right; padding: 8px; border: none;"><strong>IVA (16%):</strong></td>
              <td style="padding: 8px; border: none;">${formatCurrency(fullInvoice.tax_amount)}</td>
            </tr>
            <tr style="border-top: 2px solid #333;">
              <td style="text-align: right; padding: 12px; border: none; font-weight: bold; font-size: 16px;"><strong>Total:</strong></td>
              <td style="padding: 12px; border: none; font-weight: bold; font-size: 16px;">${formatCurrency(fullInvoice.total_amount)}</td>
            </tr>
          </table>
        </div>

        ${fullInvoice.notes ? `
        <div style="margin-top: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Notas</h3>
          <p style="margin: 5px 0;">${fullInvoice.notes}</p>
        </div>
        ` : ''}

        ${fullInvoice.admin_notes ? `
        <div style="margin-top: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Notas Administrativas</h3>
          <p style="margin: 5px 0;">${fullInvoice.admin_notes}</p>
        </div>
        ` : ''}
      `;
      
      document.body.appendChild(pdfContainer);
      
      // Convertir a canvas
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Remover el elemento temporal
      document.body.removeChild(pdfContainer);
      
      // Crear PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Descargar PDF
      pdf.save(`factura-${fullInvoice.invoice_number}.pdf`);
      
      toast.success('PDF generado correctamente', { id: 'pdf-generation' });
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error al generar el PDF', { id: 'pdf-generation' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;
    
    setIsUpdating(true);
    try {
      await onStatusUpdate(invoice.id, selectedStatus, adminNotes);
      setSelectedStatus('');
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Factura: {invoice.invoice_number}
                </h3>
                <p className="text-sm text-gray-500">
                  Detalles completos de la factura
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF || isLoading}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                  title="Descargar PDF"
                >
                  <Download className="h-4 w-4" />
                  {isGeneratingPDF ? 'Generando...' : 'PDF'}
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <LoadingSpinner size="lg" />
            ) : (
              <div className="space-y-6">
                {/* Información del cliente */}
                <div className="card">
                  <div className="card-header">
                    <h4 className="text-md font-medium text-gray-900">Información del Cliente</h4>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{fullInvoice?.client_name}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{fullInvoice?.client_email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{fullInvoice?.client_phone}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{fullInvoice?.client_address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información de la factura */}
                <div className="card">
                  <div className="card-header">
                    <h4 className="text-md font-medium text-gray-900">Información de la Factura</h4>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-xs text-gray-500">Fecha de emisión</p>
                          <p className="text-sm text-gray-900">
                            {new Date(fullInvoice?.issue_date).toLocaleDateString('es-MX')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-xs text-gray-500">Fecha de vencimiento</p>
                          <p className="text-sm text-gray-900">
                            {new Date(fullInvoice?.due_date).toLocaleDateString('es-MX')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(fullInvoice?.total_amount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Estados */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Estado Administrativo</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(fullInvoice?.admin_status)}`}>
                          {getStatusIcon(fullInvoice?.admin_status)}
                          <span className="ml-1 capitalize">{fullInvoice?.admin_status}</span>
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Estado General</p>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInvoiceStatusColor(fullInvoice?.status)}`}>
                      <span className="ml-1">{getInvoiceStatusText(fullInvoice?.status)}</span>
                    </span>
                      </div>
                    </div>

                    {/* Notas administrativas */}
                    {fullInvoice?.admin_notes && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-1">Notas Administrativas</p>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                          {fullInvoice.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items de la factura */}
                <div className="card">
                  <div className="card-header">
                    <h4 className="text-md font-medium text-gray-900">Items de la Factura</h4>
                  </div>
                  <div className="card-body">
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Descripción</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fullInvoice?.items?.map((item) => (
                            <tr key={item.id}>
                              <td>{item.description}</td>
                              <td>{item.quantity}</td>
                              <td>{formatCurrency(item.unit_price)}</td>
                              <td>{formatCurrency(item.total_price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totales */}
                    <div className="mt-4 text-right">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          Subtotal: {formatCurrency(fullInvoice?.subtotal)}
                        </p>
                        <p className="text-sm text-gray-600">
                          IVA: {formatCurrency(fullInvoice?.tax_amount)}
                        </p>
                        <p className="text-lg font-medium text-gray-900">
                          Total: {formatCurrency(fullInvoice?.total_amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pagos */}
                {fullInvoice?.payments && fullInvoice.payments.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <h4 className="text-md font-medium text-gray-900">Pagos Realizados</h4>
                    </div>
                    <div className="card-body">
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Fecha</th>
                              <th>Monto</th>
                              <th>Método</th>
                              <th>Referencia</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fullInvoice.payments.map((payment) => (
                              <tr key={payment.id}>
                                <td>{new Date(payment.payment_date).toLocaleDateString('es-MX')}</td>
                                <td>{formatCurrency(payment.amount)}</td>
                                <td>{payment.payment_method}</td>
                                <td>{payment.reference_number}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actualizar estado administrativo */}
                <div className="card">
                  <div className="card-header">
                    <h4 className="text-md font-medium text-gray-900">Actualizar Estado Administrativo</h4>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nuevo Estado
                        </label>
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="input"
                        >
                          <option value="">Seleccionar estado</option>
                          <option value="pending">Pendiente</option>
                          <option value="approved">Aprobada</option>
                          <option value="rejected">Rechazada</option>
                          <option value="expired">Expirada</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notas Administrativas
                        </label>
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          rows={3}
                          className="input"
                          placeholder="Ingrese notas administrativas..."
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={onClose}
                          className="btn btn-secondary"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleStatusUpdate}
                          disabled={!selectedStatus || isUpdating}
                          className="btn btn-primary disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            'Actualizar Estado'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInvoiceModal; 