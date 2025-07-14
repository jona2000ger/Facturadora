import api from './api';

class InvoiceService {
  async getInvoices(params = {}) {
    try {
      const response = await api.get('/invoices', { params });
      return response.data.data.invoices || [];
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error obteniendo facturas');
    }
  }

  async getInvoice(id) {
    try {
      const response = await api.get(`/invoices/${id}`);
      return response.data.data.invoice;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error obteniendo factura');
    }
  }

  async createInvoice(invoiceData) {
    try {
      const response = await api.post('/invoices', invoiceData);
      return response.data.data.invoice;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error creando factura');
    }
  }

  async updateInvoice(id, invoiceData) {
    try {
      const response = await api.put(`/invoices/${id}`, invoiceData);
      return response.data.data.invoice;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error actualizando factura');
    }
  }

  async updateInvoiceStatus(id, status) {
    try {
      const response = await api.put(`/invoices/${id}/status`, { status });
      return response.data.data.invoice;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error actualizando estado de factura');
    }
  }

  async deleteInvoice(id) {
    try {
      const response = await api.delete(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error eliminando factura');
    }
  }

  async sendInvoice(id) {
    try {
      const response = await api.put(`/invoices/${id}/send`);
      return response.data.data.invoice;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error enviando factura');
    }
  }

  async payInvoice(id, paymentData) {
    try {
      const response = await api.post(`/invoices/${id}/pay`, paymentData);
      return response.data.data.invoice;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error registrando pago');
    }
  }
}

export default new InvoiceService(); 