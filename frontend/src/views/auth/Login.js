import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight, RefreshCw, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../../controllers/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const { login, verifyOTP, resendOTP } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [errorType, setErrorType] = useState('error');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [validationErrors, setValidationErrors] = useState({});

  // Monitorear cambios en errorMsg
  useEffect(() => {
    console.log('=== DEBUG: errorMsg cambió ===', errorMsg);
  }, [errorMsg]);

  const {
    register: registerOTP,
    handleSubmit: handleSubmitOTP,
    formState: { errors: otpErrors },
    reset: resetOTP
  } = useForm();

  const showError = (message, type = 'error') => {
    console.log('=== DEBUG: Mostrando error ===', message, type);
    setErrorMsg(message);
    setErrorType(type);
  };

  const clearError = () => {
    console.log('=== DEBUG: Limpiando error ===');
    setErrorMsg('');
    setErrorType('error');
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Ingrese un email válido';
    }
    
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('=== DEBUG: Form submit iniciado ===');
    console.log('Email:', formData.email);
    console.log('Password:', formData.password ? '***' : 'vacío');
    
    // Validar formulario
    if (!validateForm()) {
      console.log('=== DEBUG: Validación falló ===', validationErrors);
      return;
    }
    
    const email = formData.email.trim();
    const password = formData.password;
    
    console.log('=== DEBUG: Iniciando login ===');
    setIsLoading(true);
    clearError(); // Limpiar errores previos
    
    try {
      console.log('=== DEBUG: Llamando a login() ===');
      const response = await login(email, password);
      console.log('=== DEBUG: Login exitoso ===', response);
      setUserId(response.userId);
      setUserEmail(response.email);
      setShowOTP(true);
      toast.success('Código de verificación enviado a su correo');
    } catch (error) {
      console.log('=== DEBUG: Error en login ===', error);
      console.log('=== DEBUG: Mensaje de error ===', error.message);
      
      // Mostrar error inmediatamente
      if (error.message.includes('Email o contraseña incorrectos')) {
        showError('El email o la contraseña que ingresó no son correctos. Por favor, verifique sus datos e intente nuevamente.', 'error');
      } else if (error.message.includes('Usuario no encontrado')) {
        showError('No existe una cuenta con este email. Porifique el email o contacte al administrador.', 'warning');
      } else if (error.message.includes('Error del servidor')) {
        showError('Ha ocurrido un error en el servidor. Por favor, intente más tarde o contacte al administrador.', 'error');
      } else {
        showError(error.message || 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.', 'error');
      }
      
      // Limpiar solo la contraseña en caso de error
      setFormData(prev => ({ ...prev, password: '' }));
    } finally {
      console.log('=== DEBUG: Finalizando login ===');
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores de validación específicos
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Limpiar error general cuando el usuario empiece a escribir
    if (errorMsg) {
      clearError();
    }
  };

  const onSubmitOTP = async (data) => {
    setIsLoading(true);
    try {
      await verifyOTP(userId, data.otp);
      toast.success('Login exitoso');
      navigate('/dashboard');
    } catch (error) {
      showError(error.message || 'Error verificando el código. Por favor, intente nuevamente.', 'error');
      resetOTP();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      await resendOTP(userId);
      toast.success('Nuevo código enviado a su correo');
      resetOTP();
    } catch (error) {
      showError(error.message || 'No se pudo reenviar el código. Por favor, intente nuevamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowOTP(false);
    setUserId(null);
    setUserEmail('');
    setFormData({ email: '', password: '' });
    setValidationErrors({});
    resetOTP();
    clearError();
  };

  const renderError = () => {
    if (!errorMsg) return null;
    
    console.log('=== DEBUG: Renderizando error ===', errorMsg, errorType);
    
    const isWarning = errorType === 'warning';
    const bgColor = isWarning ? 'bg-amber-50' : 'bg-red-50';
    const borderColor = isWarning ? 'border-amber-400' : 'border-red-400';
    const textColor = isWarning ? 'text-amber-800' : 'text-red-800';
    const iconColor = isWarning ? 'text-amber-500' : 'text-red-500';
    const Icon = isWarning ? AlertTriangle : AlertCircle;
    
    return (
      <div className={`flex items-start mb-6 p-4 rounded-lg border-l-4 ${bgColor} ${borderColor} shadow-sm`}>
        <Icon className={`h-5 w-5 ${iconColor} mr-3 mt-0.5 flex-shrink-0`} />
        <div className="flex-1">
          <p className={`${textColor} text-sm font-medium`}>{errorMsg}</p>
        </div>
        <button
          onClick={clearError}
          className={`ml-3 ${textColor} hover:opacity-70 transition-opacity`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const renderValidationError = (fieldName) => {
    if (!validationErrors[fieldName]) return null;
    
    return (
      <div className="flex items-center mt-2 text-red-600 text-sm">
        <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
        <span>{validationErrors[fieldName]}</span>
      </div>
    );
  };

  if (showOTP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Verificación de Seguridad
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Ingrese el código de 6 dígitos enviado a {userEmail}
            </p>
          </div>
          {renderError()}
          <form className="mt-8 space-y-6" onSubmit={handleSubmitOTP(onSubmitOTP)}>
            <div>
              <label htmlFor="otp" className="sr-only">
                Código de Verificación
              </label>
              <div className="relative">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  maxLength="6"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm text-center text-2xl tracking-widest"
                  placeholder="000000"
                  {...registerOTP('otp', {
                    required: 'El código es requerido',
                    minLength: { value: 6, message: 'El código debe tener 6 dígitos' },
                    maxLength: { value: 6, message: 'El código debe tener 6 dígitos' }
                  })}
                />
              </div>
              {otpErrors.otp && (
                <div className="flex items-center mt-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{otpErrors.otp.message}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                ← Volver al login
              </button>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading}
                className="flex items-center text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reenviar código
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Verificando...' : 'Verificar Código'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingrese sus credenciales para continuar
          </p>
        </div>
        
        {/* Mostrar error siempre que exista */}
        {renderError()}
        
        <form className="mt-8 space-y-6" onSubmit={handleFormSubmit} autoComplete="off">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="off"
                  className={`appearance-none relative block w-full px-3 py-2 pl-10 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
                    validationErrors.email 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
              </div>
              {renderValidationError('email')}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  className={`appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
                    validationErrors.password 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {renderValidationError('password')}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Iniciando sesión...' : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 