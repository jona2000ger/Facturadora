import api from './api';

class RoleService {
  async getRoles() {
    try {
      const response = await api.get('/roles');
      return response.data.data.roles;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error obteniendo roles');
    }
  }

  async getRole(id) {
    try {
      const response = await api.get(`/roles/${id}`);
      return response.data.data.role;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error obteniendo rol');
    }
  }

  async createRole(roleData) {
    try {
      const response = await api.post('/roles', roleData);
      return response.data.data.role;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error creando rol');
    }
  }

  async updateRole(id, roleData) {
    try {
      const response = await api.put(`/roles/${id}`, roleData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error actualizando rol');
    }
  }

  async deleteRole(id) {
    try {
      const response = await api.delete(`/roles/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error eliminando rol');
    }
  }

  async getPermissions() {
    try {
      const response = await api.get('/roles/permissions/all');
      return response.data.data.permissions;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error obteniendo permisos');
    }
  }
}

export default new RoleService(); 