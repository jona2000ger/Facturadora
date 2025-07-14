import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import invoiceService from '../models/invoiceService';
import { toast } from 'react-hot-toast';

export const useInvoices = () => {
  const queryClient = useQueryClient();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Query para obtener todas las facturas
  const {
    data: invoicesData,
    isLoading: isLoadingInvoices,
    error: invoicesError,
    refetch: refetchInvoices
  } = useQuery('invoices', invoiceService.getInvoices, {
    onSuccess: (data) => {
      setInvoices(data);
    },
    onError: (error) => {
      toast.error('Error al cargar las facturas');
      console.error('Error loading invoices:', error);
    }
  });

  // Mutation para crear factura
  const createInvoiceMutation = useMutation(invoiceService.createInvoice, {
    onSuccess: () => {
      queryClient.invalidateQueries('invoices');
      toast.success('Factura creada exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear la factura');
    }
  });

  // Mutation para actualizar factura
  const updateInvoiceMutation = useMutation(
    ({ id, data }) => invoiceService.updateInvoice(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
        toast.success('Factura actualizada exitosamente');
      },
      onError: (error) => {
        toast.error(error.message || 'Error al actualizar la factura');
      }
    }
  );

  // Mutation para eliminar factura
  const deleteInvoiceMutation = useMutation(invoiceService.deleteInvoice, {
    onSuccess: () => {
      queryClient.invalidateQueries('invoices');
      toast.success('Factura eliminada exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar la factura');
    }
  });

  // Mutation para enviar factura
  const sendInvoiceMutation = useMutation(invoiceService.sendInvoice, {
    onSuccess: () => {
      queryClient.invalidateQueries('invoices');
      toast.success('Factura enviada exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al enviar la factura');
    }
  });

  // Mutation para pagar factura
  const payInvoiceMutation = useMutation(
    ({ id, paymentData }) => invoiceService.payInvoice(id, paymentData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
        toast.success('Pago registrado exitosamente');
      },
      onError: (error) => {
        toast.error(error.message || 'Error al registrar el pago');
      }
    }
  );

  // Función para crear factura
  const createInvoice = async (data) => {
    setIsLoading(true);
    try {
      await createInvoiceMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para actualizar factura
  const updateInvoice = async (id, data) => {
    setIsLoading(true);
    try {
      await updateInvoiceMutation.mutateAsync({ id, data });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para eliminar factura
  const deleteInvoice = async (id) => {
    setIsLoading(true);
    try {
      await deleteInvoiceMutation.mutateAsync(id);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para enviar factura
  const sendInvoice = async (id) => {
    setIsLoading(true);
    try {
      await sendInvoiceMutation.mutateAsync(id);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para pagar factura
  const payInvoice = async (id, paymentData) => {
    setIsLoading(true);
    try {
      await payInvoiceMutation.mutateAsync({ id, paymentData });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener una factura específica
  const getInvoice = async (id) => {
    try {
      const response = await invoiceService.getInvoice(id);
      return response;
    } catch (error) {
      toast.error('Error al cargar la factura');
      throw error;
    }
  };

  return {
    invoices: Array.isArray(invoicesData) ? invoicesData : [],
    isLoading: isLoadingInvoices || isLoading,
    error: invoicesError,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    sendInvoice,
    payInvoice,
    getInvoice,
    refetchInvoices
  };
}; 