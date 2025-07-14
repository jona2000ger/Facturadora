import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import roleService from '../models/roleService';

export const useRoles = () => {
  const queryClient = useQueryClient();

  // Query para obtener todos los roles
  const {
    data: roles = [],
    isLoading,
    error,
    refetch
  } = useQuery('roles', roleService.getRoles, {
    onError: (error) => {
      toast.error('Error al cargar los roles');
      console.error('Error loading roles:', error);
    }
  });

  // Query para obtener permisos
  const {
    data: permissions = [],
    isLoading: permissionsLoading
  } = useQuery('permissions', roleService.getPermissions, {
    onError: (error) => {
      toast.error('Error al cargar los permisos');
      console.error('Error loading permissions:', error);
    }
  });

  // Mutation para crear rol
  const createRoleMutation = useMutation(roleService.createRole, {
    onSuccess: () => {
      queryClient.invalidateQueries('roles');
      toast.success('Rol creado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear el rol');
    }
  });

  // Mutation para actualizar rol
  const updateRoleMutation = useMutation(
    ({ id, data }) => roleService.updateRole(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('roles');
        toast.success('Rol actualizado exitosamente');
      },
      onError: (error) => {
        toast.error(error.message || 'Error al actualizar el rol');
      }
    }
  );

  // Mutation para eliminar rol
  const deleteRoleMutation = useMutation(roleService.deleteRole, {
    onSuccess: () => {
      queryClient.invalidateQueries('roles');
      toast.success('Rol eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar el rol');
    }
  });

  // Función para crear rol
  const createRole = async (roleData) => {
    try {
      await createRoleMutation.mutateAsync(roleData);
    } catch (error) {
      throw error;
    }
  };

  // Función para actualizar rol
  const updateRole = async (id, roleData) => {
    try {
      await updateRoleMutation.mutateAsync({ id, data: roleData });
    } catch (error) {
      throw error;
    }
  };

  // Función para eliminar rol
  const deleteRole = async (id) => {
    try {
      await deleteRoleMutation.mutateAsync(id);
    } catch (error) {
      throw error;
    }
  };

  // Función unificada para crear o actualizar rol
  const saveRole = async (roleData) => {
    try {
      if (roleData.id) {
        // Actualizar rol existente
        const { id, ...data } = roleData;
        await updateRole(id, data);
      } else {
        // Crear nuevo rol
        await createRole(roleData);
      }
    } catch (error) {
      throw error;
    }
  };

  // Hook para obtener un rol específico
  const useRole = (id) => {
    return useQuery(
      ['role', id],
      () => roleService.getRole(id),
      {
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutos
        cacheTime: 10 * 60 * 1000, // 10 minutos
      }
    );
  };

  return {
    roles,
    permissions,
    isLoading: isLoading || permissionsLoading,
    error,
    createRole,
    updateRole,
    deleteRole,
    saveRole,
    useRole,
    refetch,
    createLoading: createRoleMutation.isLoading,
    updateLoading: updateRoleMutation.isLoading,
    deleteLoading: deleteRoleMutation.isLoading,
  };
}; 