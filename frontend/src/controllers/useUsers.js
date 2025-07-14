import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import userService from '../models/userService';

export const useUsers = (params = {}) => {
  const queryClient = useQueryClient();

  // Query para obtener usuarios
  const {
    data: usersData = { users: [], pagination: {} },
    isLoading,
    error,
    refetch
  } = useQuery(['users', params], () => userService.getUsers(params), {
    onError: (error) => {
      toast.error('Error al cargar los usuarios');
      console.error('Error loading users:', error);
    }
  });

  // Mutation para crear usuario
  const createUserMutation = useMutation(userService.createUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      toast.success('Usuario creado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear el usuario');
    }
  });

  // Mutation para actualizar usuario
  const updateUserMutation = useMutation(
    ({ id, data }) => userService.updateUser(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('Usuario actualizado exitosamente');
      },
      onError: (error) => {
        toast.error(error.message || 'Error al actualizar el usuario');
      }
    }
  );

  // Mutation para eliminar usuario
  const deleteUserMutation = useMutation(userService.deleteUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      toast.success('Usuario eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar el usuario');
    }
  });

  // Mutation para cambiar estado de usuario
  const updateUserStatusMutation = useMutation(
    ({ id, isActive }) => userService.updateUserStatus(id, isActive),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('Estado del usuario actualizado');
      },
      onError: (error) => {
        toast.error(error.message || 'Error al actualizar el estado');
      }
    }
  );

  // Función para crear usuario
  const createUser = async (userData) => {
    try {
      await createUserMutation.mutateAsync(userData);
    } catch (error) {
      throw error;
    }
  };

  // Función para actualizar usuario
  const updateUser = async (id, userData) => {
    try {
      await updateUserMutation.mutateAsync({ id, data: userData });
    } catch (error) {
      throw error;
    }
  };

  // Función para eliminar usuario
  const deleteUser = async (id) => {
    try {
      await deleteUserMutation.mutateAsync(id);
    } catch (error) {
      throw error;
    }
  };

  // Función para cambiar estado de usuario
  const updateUserStatus = async (id, isActive) => {
    try {
      await updateUserStatusMutation.mutateAsync({ id, isActive });
    } catch (error) {
      throw error;
    }
  };

  // Función unificada para crear o actualizar usuario
  const saveUser = async (userData) => {
    try {
      if (userData.id) {
        // Actualizar usuario existente
        const { id, ...data } = userData;
        await updateUser(id, data);
      } else {
        // Crear nuevo usuario
        await createUser(userData);
      }
    } catch (error) {
      throw error;
    }
  };

  // Hook para obtener un usuario específico
  const useUser = (id) => {
    return useQuery(
      ['user', id],
      () => userService.getUser(id),
      {
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutos
        cacheTime: 10 * 60 * 1000, // 10 minutos
      }
    );
  };

  return {
    users: usersData.users,
    pagination: usersData.pagination,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    saveUser,
    useUser,
    refetch,
    createLoading: createUserMutation.isLoading,
    updateLoading: updateUserMutation.isLoading,
    deleteLoading: deleteUserMutation.isLoading,
    statusLoading: updateUserStatusMutation.isLoading,
  };
}; 