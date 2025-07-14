import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { useProducts } from '../../controllers/useProducts';
import LoadingSpinner from '../components/LoadingSpinner';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { createProduct, updateProduct, useProduct } = useProducts();
  const isEditing = Boolean(id);
  
  // Usar React Query para obtener el producto
  const { data: product, isLoading: isLoadingProduct, error: productError } = useProduct(id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  useEffect(() => {
    if (isEditing && product && !isLoadingProduct) {
      console.log('Producto recibido:', product);
      
      // Mapear campos del backend al formulario con valores por defecto
      const formData = {
        name: product.name || '',
        description: product.description || '',
        price: product.price || 0,
        cost: product.cost || '',
        sku: product.sku || '',
        stock_quantity: product.stock_quantity || 0
      };
      console.log('Datos del formulario:', formData);
      reset(formData);
    }
  }, [product, isEditing, isLoadingProduct, reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      console.log('Datos del formulario enviados:', data);
      
      // Validar datos requeridos
      if (!data.name || !data.price) {
        throw new Error('Nombre y precio son requeridos');
      }
      
      // Preparar datos para el backend con validación
      const productData = {
        name: data.name.trim(),
        description: data.description || '',
        price: parseFloat(data.price) || 0,
        cost: data.cost && data.cost !== '' ? parseFloat(data.cost) : null,
        sku: data.sku || '',
        stock_quantity: parseInt(data.stock_quantity) || 0
      };
      
      console.log('Datos preparados para el backend:', productData);

      if (isEditing) {
        console.log('Actualizando producto con ID:', id);
        await updateProduct(id, productData);
        toast.success('Producto actualizado exitosamente');
      } else {
        console.log('Creando nuevo producto');
        await createProduct(productData);
        toast.success('Producto creado exitosamente');
      }
      navigate('/products');
    } catch (error) {
      console.error('Error al guardar el producto:', error);
      toast.error(error.message || 'Error al guardar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar errores del producto
  useEffect(() => {
    if (productError) {
      console.error('Error al cargar el producto:', productError);
      toast.error('Error al cargar el producto: ' + productError.message);
      navigate('/products');
    }
  }, [productError, navigate]);

  if (isLoading || isLoadingProduct) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/products')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del producto *
                </label>
                <input
                  {...register('name', { required: 'El nombre es requerido' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nombre del producto"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU
                </label>
                <input
                  {...register('sku')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Código SKU"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <input
                  {...register('category')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Categoría del producto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    {...register('price', {
                      required: 'El precio es requerido',
                      min: { value: 0, message: 'El precio debe ser mayor a 0' }
                    })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Costo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    {...register('cost', {
                      min: { value: 0, message: 'El costo debe ser mayor o igual a 0' }
                    })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
                {errors.cost && (
                  <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock *
                </label>
                <input
                  {...register('stock_quantity', {
                    required: 'El stock es requerido',
                    min: { value: 0, message: 'El stock debe ser mayor o igual a 0' }
                  })}
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
                {errors.stock_quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.stock_quantity.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Descripción del producto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidad de medida
                </label>
                <select
                  {...register('unit')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Seleccionar unidad</option>
                  <option value="pieza">Pieza</option>
                  <option value="kg">Kilogramo</option>
                  <option value="l">Litro</option>
                  <option value="m">Metro</option>
                  <option value="hora">Hora</option>
                  <option value="servicio">Servicio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Impuesto (%)
                </label>
                <input
                  {...register('tax_rate', {
                    min: { value: 0, message: 'El impuesto debe ser mayor o igual a 0' },
                    max: { value: 100, message: 'El impuesto no puede ser mayor a 100%' }
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="16.00"
                />
                {errors.tax_rate && (
                  <p className="mt-1 text-sm text-red-600">{errors.tax_rate.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm; 