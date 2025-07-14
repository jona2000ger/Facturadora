import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import adminService from '../models/adminService';

export const useAdminInvoices = (params = {}) => {
  const [filters, setFilters] = useState(params);
  const queryClient = useQueryClient();

  // Obtener facturas para administración
  const {
    data: invoicesData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['adminInvoices', filters],
    () => adminService.getAdminInvoices(filters),
    {
      keepPreviousData: true,
    }
  );

  // Actualizar estado administrativo
  const updateStatusMutation = useMutation(
    ({ id, adminStatus, adminNotes }) => adminService.updateInvoiceAdminStatus(id, adminStatus, adminNotes),
    {
      onSuccess: () => {
        // Invalidar todas las consultas relacionadas
        queryClient.invalidateQueries('adminInvoices');
        queryClient.invalidateQueries('adminDashboard');
        queryClient.invalidateQueries('invoices');
        queryClient.invalidateQueries('products');
        toast.success('Estado administrativo actualizado correctamente');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }
  );

  const updateInvoiceStatus = (id, adminStatus, adminNotes) => {
    updateStatusMutation.mutate({ id, adminStatus, adminNotes });
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    invoices: invoicesData?.invoices || [],
    pagination: invoicesData?.pagination,
    isLoading,
    error,
    filters,
    updateFilters,
    updateInvoiceStatus,
    refetch,
    updateLoading: updateStatusMutation.isLoading,
  };
};

export const useAdminInvoice = (id) => {
  return useQuery(
    ['adminInvoice', id],
    () => adminService.getAdminInvoice(id),
    {
      enabled: !!id,
    }
  );
};

export const useAdminDashboard = () => {
  const queryClient = useQueryClient();
  
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useQuery(
    'adminDashboard',
    adminService.getAdminDashboard,
    {
      refetchInterval: 30000, // Refrescar cada 30 segundos
      staleTime: 10000, // Considerar datos frescos por 10 segundos
    }
  );

  const refreshDashboard = () => {
    queryClient.invalidateQueries('adminDashboard');
    refetch();
  };

  return {
    data: dashboardData,
    isLoading,
    error,
    refetch: refreshDashboard,
  };
};

export const useAdminReports = (params = {}) => {
  const [filters, setFilters] = useState(params);

  const {
    data: reportsData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['adminReports', filters],
    () => adminService.getAdminReports(filters),
    {
      keepPreviousData: true,
    }
  );

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    invoices: reportsData?.invoices || [],
    isLoading,
    error,
    filters,
    updateFilters,
    refetch,
  };
}; 