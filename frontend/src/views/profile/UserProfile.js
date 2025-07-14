import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../controllers/useAuth';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, MapPin, Calendar, Shield, Save, Edit, Lock, Bell, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ChangePasswordModal from './ChangePasswordModal';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || ''
    }
  });

  const onSubmit = async (data) => {
    try {
      // Aquí iría la llamada al servicio para actualizar el perfil
      console.log('Actualizando perfil:', data);
      toast.success('Perfil actualizado exitosamente');
      setIsEditing(false);
    } catch (error) {
      toast.error('Error al actualizar el perfil');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    reset({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || ''
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset();
  };

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
  };

  const handleNotifications = () => {
    toast.info('Función de notificaciones en desarrollo');
    // navigate('/notifications');
  };

  const handleActivityHistory = () => {
    toast.info('Función de historial en desarrollo');
    // navigate('/activity-history');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-purple-100 text-purple-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin':
        return '👑 Administrador';
      case 'manager':
        return '👨‍💼 Gerente';
      case 'user':
        return '👤 Usuario';
      default:
        return '👤 Usuario';
    }
  };

  // Formatear fecha de creación
  const formatCreatedAt = (createdAt) => {
    if (!createdAt) return 'N/A';
    try {
      return new Date(createdAt).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
            <p className="text-gray-600">Gestiona tu información personal</p>
          </div>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar Perfil
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del perfil */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Información Personal</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      {...register('first_name', { required: 'El nombre es requerido' })}
                      type="text"
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido *
                    </label>
                    <input
                      {...register('last_name', { required: 'El apellido es requerido' })}
                      type="text"
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    {...register('email', { 
                      required: 'El email es requerido',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido'
                      }
                    })}
                    type="email"
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <textarea
                    {...register('address')}
                    rows={3}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Guardar Cambios
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Sidebar con información adicional */}
          <div className="space-y-6">
            {/* Avatar y rol */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-4">
                  <User size={32} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {user?.first_name} {user?.last_name}
                </h3>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full mt-2 ${getRoleColor(user?.role)}`}>
                  {getRoleText(user?.role)}
                </span>
              </div>
            </div>

            {/* Información de la cuenta */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Información de la Cuenta</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Miembro desde</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCreatedAt(user?.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Estado de la cuenta</p>
                    <p className="text-sm font-medium text-green-600">Activa</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
              <div className="space-y-2">
                <button 
                  onClick={handleChangePassword}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center gap-2 cursor-pointer transition-colors duration-200 border border-transparent hover:border-gray-200"
                >
                  <Lock className="h-4 w-4" />
                  Cambiar contraseña
                </button>
                <button 
                  onClick={handleNotifications}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center gap-2 cursor-pointer transition-colors duration-200 border border-transparent hover:border-gray-200"
                >
                  <Bell className="h-4 w-4" />
                  Configuración de notificaciones
                </button>
                <button 
                  onClick={handleActivityHistory}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center gap-2 cursor-pointer transition-colors duration-200 border border-transparent hover:border-gray-200"
                >
                  <Clock className="h-4 w-4" />
                  Historial de actividad
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ChangePasswordModal isOpen={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} />
    </div>
  );
};

export default UserProfile; 