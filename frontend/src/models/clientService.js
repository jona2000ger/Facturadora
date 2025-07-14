import api from './api';

class ClientService {
  async getClients(params = {}) {
    try {
      const response = await api.get('/clients', { params });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error obteniendo clientes');
    }
  }

  async getClient(id) {
    try {
      const response = await api.get(`/clients/${id}`);
      return response.data.data.client;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error obteniendo cliente');
    }
  }

  async createClient(clientData) {
    try {
      const response = await api.post('/clients', clientData);
      return response.data.data.client;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error creando cliente');
    }
  }

  async updateClient(id, clientData) {
    try {
      const response = await api.put(`/clients/${id}`, clientData);
      return response.data.data.client;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error actualizando cliente');
    }
  }

  async deleteClient(id) {
    try {
      const response = await api.delete(`/clients/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error eliminando cliente');
    }
  }
}

export default new ClientService(); 