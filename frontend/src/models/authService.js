import api from './api';

class AuthService {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data.data;
    } catch (error) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.error;
      
      if (status === 401) {
        if (errorMessage === 'Credenciales inválidas') {
          throw new Error('Email o contraseña incorrectos. Por favor, verifique sus credenciales.');
        }
        throw new Error('Credenciales inválidas');
      } else if (status === 400) {
        throw new Error(errorMessage || 'Datos de entrada inválidos');
      } else if (status === 404) {
        throw new Error('Usuario no encontrado');
      } else if (status >= 500) {
        throw new Error('Error del servidor. Por favor, intente más tarde.');
      } else {
        throw new Error(errorMessage || 'Error en el login');
      }
    }
  }

  async verifyOTP(userId, otp) {
    try {
      const response = await api.post('/auth/verify-otp', { userId, otp });
      return response.data.data;
    } catch (error) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.error;
      
      if (status === 400) {
        if (errorMessage?.includes('Código de verificación inválido')) {
          throw new Error('Código de verificación incorrecto o expirado. Por favor, solicite un nuevo código.');
        }
        throw new Error(errorMessage || 'Código de verificación inválido');
      } else if (status === 404) {
        throw new Error('Usuario no encontrado');
      } else if (status >= 500) {
        throw new Error('Error del servidor. Por favor, intente más tarde.');
      } else {
        throw new Error(errorMessage || 'Error verificando código');
      }
    }
  }

  async resendOTP(userId) {
    try {
      const response = await api.post('/auth/resend-otp', { userId });
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.error;
      
      if (status === 404) {
        throw new Error('Usuario no encontrado');
      } else if (status >= 500) {
        throw new Error('Error del servidor. Por favor, intente más tarde.');
      } else {
        throw new Error(errorMessage || 'Error reenviando código');
      }
    }
  }

  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return response.data.data;
    } catch (error) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.error;
      
      if (status === 401) {
        throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
      } else if (status >= 500) {
        throw new Error('Error del servidor. Por favor, intente más tarde.');
      } else {
        throw new Error(errorMessage || 'Error obteniendo perfil');
      }
    }
  }
}

export default new AuthService(); 