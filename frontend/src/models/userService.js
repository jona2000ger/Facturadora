import api from './api';

class UserService {
  async getUsers(params = {}) {
    try {
      const response = await api.get('/users', { params });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error obteniendo usuarios');
    }
  }

  async getUser(id) {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data.data.user;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error obteniendo usuario');
    }
  }

  async createUser(userData) {
    try {
      const response = await api.post('/users', userData);
      return response.data.data.user;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error creando usuario');
    }
  }

  async updateUser(id, userData) {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data.data.user;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error actualizando usuario');
    }
  }

  async deleteUser(id) {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error eliminando usuario');
    }
  }

  async updateUserStatus(id, isActive) {
    try {
      const response = await api.put(`/users/${id}/status`, { is_active: isActive });
      return response.data.data.user;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error actualizando estado del usuario');
    }
  }
}

export default new UserService(); 