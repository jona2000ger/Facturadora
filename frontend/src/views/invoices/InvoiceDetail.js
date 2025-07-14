import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Mail, Send, DollarSign } from 'lucide-react';
import { useInvoices } from '../../controllers/useInvoices';
import LoadingSpinner from '../components/LoadingSpinner';
import PaymentModal from '../../components/PaymentModal';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { getInvoice, sendInvoice, payInvoice } = useInvoices();

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        console.log('Cargando factura con ID:', id);
        const data = await getInvoice(id);
        console.log('Datos de la factura recibidos:', data);
        setInvoice(data);
      } catch (error) {
        console.error('Error al cargar la factura:', error);
        toast.error('Error al cargar la factura: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoice();
  }, [id, getInvoice]);

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

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return '✓ Pagada';
      case 'sent':
        return '⏳ Pendiente de Pago';
      case 'draft':
        return '📝 Borrador';
      case 'cancelled':
        return '❌ Cancelada';
      default:
        return status || 'Desconocido';
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
        return '📋 Pendiente de Revisión';
    }
  };

  const canSendInvoice = () => {
    return invoice.status === 'draft' && invoice.admin_status === 'approved';
  };

  const getSendButtonText = () => {
    if (invoice.status !== 'draft') {
      return 'No se puede enviar';
    }
    
    switch (invoice.admin_status) {
      case 'pending':
        return 'Esperando Aprobación del Admin';
      case 'rejected':
        return 'Rechazada por Admin';
      case 'expired':
        return 'Expirada';
      case 'approved':
        return 'Enviar Factura';
      default:
        return 'Pendiente de Revisión';
    }
  };

  const getSendButtonDisabled = () => {
    return !canSendInvoice();
  };

  const getSendButtonColor = () => {
    if (canSendInvoice()) {
      return 'bg-blue-600 hover:bg-blue-700';
    }
    return 'bg-gray-400 cursor-not-allowed';
  };

  const handleSendInvoice = async () => {
    try {
      await sendInvoice(invoice.id);
      // Recargar la factura para obtener el estado actualizado
      const updatedInvoice = await getInvoice(id);
      setInvoice(updatedInvoice);
      toast.success('Factura enviada por correo electrónico correctamente');
    } catch (error) {
      toast.error(error.message || 'Error al enviar la factura');
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      await payInvoice(invoice.id, paymentData);
      // Recargar la factura para obtener el estado actualizado
      const updatedInvoice = await getInvoice(id);
      setInvoice(updatedInvoice);
    } catch (error) {
      throw error;
    }
  };

  const handleDownload = async () => {
    if (!invoice) return;
    
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
          <h2 style="margin: 10px 0 0 0; font-size: 20px; color: #666;">${invoice.invoice_number}</h2>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Empresa</h3>
          <p style="margin: 5px 0;"><strong>Facturadora S.A.</strong></p>
          <p style="margin: 5px 0;">Dirección de la empresa</p>
          <p style="margin: 5px 0;">RFC: XXX-000000-XX1</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Información de la Factura</h3>
          <p style="margin: 5px 0;"><strong>Número:</strong> ${invoice.invoice_number}</p>
          <p style="margin: 5px 0;"><strong>Fecha de emisión:</strong> ${formatDate(invoice.issue_date)}</p>
          <p style="margin: 5px 0;"><strong>Fecha de vencimiento:</strong> ${formatDate(invoice.due_date)}</p>
          <p style="margin: 5px 0;"><strong>Estado:</strong> ${getStatusText(invoice.status)}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Información del Cliente</h3>
          <p style="margin: 5px 0;"><strong>Nombre:</strong> ${invoice.client_name}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${invoice.client_email}</p>
          <p style="margin: 5px 0;"><strong>Teléfono:</strong> ${invoice.client_phone || 'No especificado'}</p>
          <p style="margin: 5px 0;"><strong>Dirección:</strong> ${invoice.client_address || 'No especificada'}</p>
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
            ${invoice.items?.map(item => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px;">${item.description}</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${item.quantity}</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${formatPrice(item.unit_price)}</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${formatPrice(item.quantity * item.unit_price)}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>

        <div style="margin-top: 30px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="text-align: right; padding: 8px; border: none;"><strong>Subtotal:</strong></td>
              <td style="padding: 8px; border: none;">${formatPrice(invoice.subtotal)}</td>
            </tr>
            <tr>
              <td style="text-align: right; padding: 8px; border: none;"><strong>IVA (16%):</strong></td>
              <td style="padding: 8px; border: none;">${formatPrice(invoice.tax_amount)}</td>
            </tr>
            <tr style="border-top: 2px solid #333;">
              <td style="text-align: right; padding: 12px; border: none; font-weight: bold; font-size: 16px;"><strong>Total:</strong></td>
              <td style="padding: 12px; border: none; font-weight: bold; font-size: 16px;">${formatPrice(invoice.total_amount)}</td>
            </tr>
          </table>
        </div>

        ${invoice.notes ? `
        <div style="margin-top: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Notas</h3>
          <p style="margin: 5px 0;">${invoice.notes}</p>
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
      pdf.save(`factura-${invoice.invoice_number}.pdf`);
      
      toast.success('PDF generado correctamente', { id: 'pdf-generation' });
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error al generar el PDF', { id: 'pdf-generation' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    // Crear una nueva ventana para imprimir
    const printWindow = window.open('', '_blank');
    
    const invoiceHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Factura ${invoice.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .company-info { margin-bottom: 30px; }
          .invoice-info { margin-bottom: 30px; }
          .client-info { margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; }
          .totals { margin-top: 30px; }
          .total-row { font-weight: bold; font-size: 18px; border-top: 2px solid #333; }
          .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .status-paid { background-color: #d4edda; color: #155724; }
          .status-sent { background-color: #fff3cd; color: #856404; }
          .status-draft { background-color: #e2e3e5; color: #383d41; }
          .status-cancelled { background-color: #f8d7da; color: #721c24; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FACTURA</h1>
          <h2>${invoice.invoice_number}</h2>
        </div>

        <div class="company-info">
          <h3>Empresa</h3>
          <p><strong>Facturadora S.A.</strong></p>
          <p>Dirección de la empresa</p>
          <p>RFC: XXX-000000-XX1</p>
        </div>

        <div class="invoice-info">
          <h3>Información de la Factura</h3>
          <p><strong>Número:</strong> ${invoice.invoice_number}</p>
          <p><strong>Fecha de emisión:</strong> ${formatDate(invoice.issue_date)}</p>
          <p><strong>Fecha de vencimiento:</strong> ${formatDate(invoice.due_date)}</p>
          <p><strong>Estado:</strong> <span class="status status-${invoice.status}">${getStatusText(invoice.status)}</span></p>
        </div>

        <div class="client-info">
          <h3>Información del Cliente</h3>
          <p><strong>Nombre:</strong> ${invoice.client_name}</p>
          <p><strong>Email:</strong> ${invoice.client_email}</p>
          <p><strong>Teléfono:</strong> ${invoice.client_phone || 'No especificado'}</p>
          <p><strong>Dirección:</strong> ${invoice.client_address || 'No especificada'}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items?.map(item => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${formatPrice(item.unit_price)}</td>
                <td>${formatPrice(item.quantity * item.unit_price)}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td colspan="3" style="text-align: right;"><strong>Subtotal:</strong></td>
              <td>${formatPrice(invoice.subtotal)}</td>
            </tr>
            <tr>
              <td colspan="3" style="text-align: right;"><strong>IVA (16%):</strong></td>
              <td>${formatPrice(invoice.tax_amount)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
              <td>${formatPrice(invoice.total_amount)}</td>
            </tr>
          </table>
        </div>

        ${invoice.notes ? `
        <div class="notes">
          <h3>Notas</h3>
          <p>${invoice.notes}</p>
        </div>
        ` : ''}

        <script>
          window.onload = function() {
            window.print();
            window.close();
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  if (isLoading) return <LoadingSpinner />;

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">Factura no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/invoices')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Factura #{invoice.invoice_number}
            </h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleDownload}
              disabled={isGeneratingPDF}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isGeneratingPDF ? 'Generando...' : 'Descargar PDF'}
            </button>
            <button 
              onClick={handlePrint}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
            {invoice.status === 'draft' && (
              <button 
                onClick={handleSendInvoice}
                disabled={getSendButtonDisabled()}
                className={`px-3 py-2 text-white rounded-md flex items-center gap-2 ${getSendButtonColor()}`}
                title={getSendButtonText()}
              >
                <Send className="h-4 w-4" />
                {getSendButtonText()}
              </button>
            )}
            
            {invoice.status === 'sent' && (
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Registrar Pago
              </button>
            )}
          </div>
        </div>

        {/* Información de la factura */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Información de la Factura</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Número:</span>
                  <span className="font-medium">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha de emisión:</span>
                  <span>{formatDate(invoice.issue_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha de vencimiento:</span>
                  <span>{formatDate(invoice.due_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                    {getStatusText(invoice.status)}
                  </span>
                </div>
                {invoice.admin_status && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado Admin:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAdminStatusColor(invoice.admin_status)}`}>
                      {getAdminStatusText(invoice.admin_status)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Información del Cliente</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre:</span>
                  <span className="font-medium">{invoice.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span>{invoice.client_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Teléfono:</span>
                  <span>{invoice.client_phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dirección:</span>
                  <span>{invoice.client_address || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items de la factura */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Items de la Factura</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Unitario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(item.unit_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(item.quantity * item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Totales</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatPrice(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IVA (16%):</span>
              <span className="font-medium">{formatPrice(invoice.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total:</span>
              <span>{formatPrice(invoice.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Notas */}
        {invoice.notes && (
          <div className="bg-white shadow-md rounded-lg p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">Notas</h2>
            <p className="text-gray-700">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Modal de Pago */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        invoice={invoice}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default InvoiceDetail; 