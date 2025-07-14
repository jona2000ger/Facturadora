import api from './api';

class ProductService {
  async getProducts(params = {}) {
    try {
      const response = await api.get('/products', { params });
      return response.data.data.products || [];
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error obteniendo productos');
    }
  }

  async getProduct(id) {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data.data.product;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error obteniendo producto');
    }
  }

  async createProduct(productData) {
    try {
      const response = await api.post('/products', productData);
      return response.data.data.product;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error creando producto');
    }
  }

  async updateProduct(id, productData) {
    try {
      const response = await api.put(`/products/${id}`, productData);
      return response.data.data.product;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error actualizando producto');
    }
  }

  async deleteProduct(id) {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error eliminando producto');
    }
  }
}

export default new ProductService(); 