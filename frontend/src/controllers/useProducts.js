import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import productService from '../models/productService';
import { toast } from 'react-hot-toast';

export const useProducts = () => {
  const queryClient = useQueryClient();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Query para obtener todos los productos
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError,
    refetch: refetchProducts
  } = useQuery('products', productService.getProducts, {
    onSuccess: (data) => {
      setProducts(data);
    },
    onError: (error) => {
      toast.error('Error al cargar los productos');
      console.error('Error loading products:', error);
    }
  });

  // Mutation para crear producto
  const createProductMutation = useMutation(productService.createProduct, {
    onSuccess: () => {
      queryClient.invalidateQueries('products');
      toast.success('Producto creado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear el producto');
    }
  });

  // Mutation para actualizar producto
  const updateProductMutation = useMutation(
    ({ id, data }) => productService.updateProduct(id, data),
    {
      onSuccess: (updatedProduct, variables) => {
        // Invalidar la caché de productos
        queryClient.invalidateQueries('products');
        // Actualizar la caché del producto específico
        queryClient.setQueryData(['product', variables.id], updatedProduct);
        toast.success('Producto actualizado exitosamente');
      },
      onError: (error) => {
        toast.error(error.message || 'Error al actualizar el producto');
      }
    }
  );

  // Mutation para eliminar producto
  const deleteProductMutation = useMutation(productService.deleteProduct, {
    onSuccess: () => {
      queryClient.invalidateQueries('products');
      toast.success('Producto eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar el producto');
    }
  });

  // Función para crear producto
  const createProduct = async (data) => {
    setIsLoading(true);
    try {
      await createProductMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para actualizar producto
  const updateProduct = async (id, data) => {
    setIsLoading(true);
    try {
      await updateProductMutation.mutateAsync({ id, data });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para eliminar producto
  const deleteProduct = async (id) => {
    setIsLoading(true);
    try {
      await deleteProductMutation.mutateAsync(id);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener un producto específico
  const getProduct = async (id) => {
    try {
      const response = await productService.getProduct(id);
      return response;
    } catch (error) {
      toast.error('Error al cargar el producto');
      throw error;
    }
  };

  // Hook para obtener un producto específico con React Query
  const useProduct = (id) => {
    return useQuery(
      ['product', id],
      () => productService.getProduct(id),
      {
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutos
        cacheTime: 10 * 60 * 1000, // 10 minutos
      }
    );
  };

  return {
    products: Array.isArray(productsData) ? productsData : [],
    isLoading: isLoadingProducts || isLoading,
    error: productsError,
    createProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    useProduct,
    refetchProducts
  };
}; 