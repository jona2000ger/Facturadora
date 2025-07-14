import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';

const AddRoleModal = ({ isOpen, onClose, onSubmit, permissions, isLoading, editingRole }) => {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();

  // Cargar datos del rol cuando se está editando
  useEffect(() => {
    if (editingRole) {
      setValue('name', editingRole.name);
      setValue('display_name', editingRole.display_name);
      setValue('description', editingRole.description || '');
      setValue('color', editingRole.color || 'blue');
      setSelectedPermissions(editingRole.permissions || []);
    } else {
      reset();
      setSelectedPermissions([]);
    }
  }, [editingRole, setValue, reset]);

  const handlePermissionToggle = (permissionName) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionName)
        ? prev.filter(p => p !== permissionName)
        : [...prev, permissionName]
    );
  };

  const handleFormSubmit = (data) => {
    const roleData = {
      ...data,
      permissions: selectedPermissions
    };

    if (editingRole) {
      // Para edición, no incluir el nombre ya que no se puede cambiar
      delete roleData.name;
      onSubmit({ id: editingRole.id, ...roleData });
    } else {
      onSubmit(roleData);
    }
    
    reset();
    setSelectedPermissions([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del rol
            </label>
            <input
              type="text"
              {...register('name', { 
                required: 'El nombre es requerido',
                minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                maxLength: { value: 50, message: 'Máximo 50 caracteres' }
              })}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                editingRole ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="admin"
              disabled={editingRole}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de visualización
            </label>
            <input
              type="text"
              {...register('display_name', { 
                required: 'El nombre de visualización es requerido',
                minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                maxLength: { value: 100, message: 'Máximo 100 caracteres' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Administrador"
            />
            {errors.display_name && (
              <p className="text-red-500 text-sm mt-1">{errors.display_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              {...register('description', { 
                maxLength: { value: 500, message: 'Máximo 500 caracteres' }
              })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción del rol..."
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <select
              {...register('color')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="blue">Azul</option>
              <option value="red">Rojo</option>
              <option value="green">Verde</option>
              <option value="yellow">Amarillo</option>
              <option value="purple">Púrpura</option>
              <option value="gray">Gris</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permisos
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {permissions && permissions.length > 0 ? (
                permissions.map((permission) => (
                  <label key={permission.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.name)}
                      onChange={() => handlePermissionToggle(permission.name)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {permission.display_name}
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No hay permisos disponibles</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? (editingRole ? 'Actualizando...' : 'Creando...') : (editingRole ? 'Actualizar Rol' : 'Crear Rol')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoleModal; 