import api from './api';

class ElectronicDocumentService {
  /**
   * Generar documento electrónico para una factura
   */
  async generateElectronicDocument(invoiceId) {
    try {
      const response = await api.post(`/electronic-documents/generate/${invoiceId}`);
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.error;
      
      if (status === 400) {
        throw new Error(errorMessage || 'Error generando documento electrónico');
      } else if (status === 404) {
        throw new Error('Factura no encontrada');
      } else if (status >= 500) {
        throw new Error('Error del servidor. Por favor, intente más tarde.');
      } else {
        throw new Error(errorMessage || 'Error generando documento electrónico');
      }
    }
  }

  /**
   * Obtener documento electrónico por ID de factura
   */
  async getElectronicDocument(invoiceId) {
    try {
      const response = await api.get(`/electronic-documents/invoice/${invoiceId}`);
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.error;
      
      if (status === 404) {
        throw new Error('Documento electrónico no encontrado');
      } else if (status >= 500) {
        throw new Error('Error del servidor. Por favor, intente más tarde.');
      } else {
        throw new Error(errorMessage || 'Error obteniendo documento electrónico');
      }
    }
  }

  /**
   * Obtener todos los documentos electrónicos
   */
  async getAllElectronicDocuments(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      
      const response = await api.get(`/electronic-documents?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.error;
      
      if (status >= 500) {
        throw new Error('Error del servidor. Por favor, intente más tarde.');
      } else {
        throw new Error(errorMessage || 'Error obteniendo documentos electrónicos');
      }
    }
  }

  /**
   * Descargar XML del documento electrónico
   */
  async downloadXML(invoiceId) {
    try {
      const response = await api.get(`/electronic-documents/download/${invoiceId}/xml`, {
        responseType: 'blob'
      });
      
      // Crear URL para descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factura-${invoiceId}.xml`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.error;
      
      if (status === 404) {
        throw new Error('Documento electrónico no encontrado');
      } else if (status >= 500) {
        throw new Error('Error del servidor. Por favor, intente más tarde.');
      } else {
        throw new Error(errorMessage || 'Error descargando XML');
      }
    }
  }

  /**
   * Reenviar documento al SRI
   */
  async resendToSRI(invoiceId) {
    try {
      const response = await api.post(`/electronic-documents/resend/${invoiceId}`);
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.error;
      
      if (status === 404) {
        throw new Error('Documento electrónico no encontrado');
      } else if (status >= 500) {
        throw new Error('Error del servidor. Por favor, intente más tarde.');
      } else {
        throw new Error(errorMessage || 'Error reenviando documento al SRI');
      }
    }
  }
}

export default new ElectronicDocumentService(); 