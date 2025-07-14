import api from './api';

class AdminService {
  async getAdminInvoices(params = {}) {
    try {
      const response = await api.get('/admin/invoices', { params });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error obteniendo facturas para administración');
    }
  }

  async getAdminInvoice(id) {
    try {
      const response = await api.get(`/admin/invoices/${id}`);
      return response.data.data.invoice;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error obteniendo factura para administración');
    }
  }

  async updateInvoiceAdminStatus(id, adminStatus, adminNotes) {
    try {
      const response = await api.put(`/admin/invoices/${id}/status`, {
        admin_status: adminStatus,
        admin_notes: adminNotes
      });
      return response.data.data.invoice;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error actualizando estado administrativo');
    }
  }

  async getAdminDashboard() {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error obteniendo dashboard de administración');
    }
  }

  async getAdminReports(params = {}) {
    try {
      const response = await api.get('/admin/reports', { params });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error obteniendo reportes');
    }
  }
}

export default new AdminService(); 