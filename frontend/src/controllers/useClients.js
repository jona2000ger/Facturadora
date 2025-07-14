import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import clientService from '../models/clientService';

export const useClients = (params = {}) => {
  const [filters, setFilters] = useState(params);
  const queryClient = useQueryClient();

  // Obtener clientes
  const {
    data: clientsData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['clients', filters],
    () => clientService.getClients(filters),
    {
      keepPreviousData: true,
    }
  );

  // Crear cliente
  const createMutation = useMutation(
    (clientData) => clientService.createClient(clientData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('clients');
        toast.success('Cliente creado exitosamente');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }
  );

  // Actualizar cliente
  const updateMutation = useMutation(
    ({ id, data }) => clientService.updateClient(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('clients');
        toast.success('Cliente actualizado exitosamente');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }
  );

  // Eliminar cliente
  const deleteMutation = useMutation(
    (id) => clientService.deleteClient(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('clients');
        toast.success('Cliente eliminado exitosamente');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }
  );

  // Obtener cliente por ID
  const useClient = (id) => {
    return useQuery(
      ['client', id],
      () => clientService.getClient(id),
      {
        enabled: !!id,
      }
    );
  };

  const createClient = (clientData) => {
    createMutation.mutate(clientData);
  };

  const updateClient = (id, clientData) => {
    updateMutation.mutate({ id, data: clientData });
  };

  const deleteClient = (id) => {
    deleteMutation.mutate(id);
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    clients: Array.isArray(clientsData?.clients) ? clientsData.clients : [],
    pagination: clientsData?.pagination,
    isLoading,
    error,
    filters,
    updateFilters,
    createClient,
    updateClient,
    deleteClient,
    useClient,
    refetch,
    createLoading: createMutation.isLoading,
    updateLoading: updateMutation.isLoading,
    deleteLoading: deleteMutation.isLoading,
  };
}; 