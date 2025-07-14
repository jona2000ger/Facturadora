import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useInvoices } from '../../controllers/useInvoices';
import { useClients } from '../../controllers/useClients';
import { useProducts } from '../../controllers/useProducts';
import LoadingSpinner from '../components/LoadingSpinner';

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { createInvoice, updateInvoice, getInvoice } = useInvoices();
  const { clients } = useClients();
  const { products } = useProducts();
  const isEditing = Boolean(id);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      items: [{ product_id: '', quantity: 1, unit_price: 0, description: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = watch("items");

  useEffect(() => {
    if (isEditing && id) {
      const loadInvoice = async () => {
        try {
          const invoice = await getInvoice(id);
          reset(invoice);
        } catch (error) {
          toast.error('Error al cargar la factura');
          navigate('/invoices');
        }
      };
      loadInvoice();
    }
  }, [id, isEditing, reset, navigate, getInvoice]);

  const calculateItemTotal = (index) => {
    const item = watchedItems[index];
    if (!item) return 0;
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unit_price) || 0;
    return quantity * unitPrice;
  };

  const calculateSubtotal = () => {
    return watchedItems.reduce((total, item, index) => {
      return total + calculateItemTotal(index);
    }, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.16; // 16% IVA
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleProductChange = (index, productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.unit_price`, product.price);
      setValue(`items.${index}.description`, product.name);
    }
  };

  const addItem = () => {
    append({ product_id: '', quantity: 1, unit_price: 0, description: '' });
  };

  const removeItem = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Calcular totales
      data.subtotal = calculateSubtotal();
      data.tax_amount = calculateTax();
      data.total_amount = calculateTotal();

      if (isEditing) {
        await updateInvoice(id, data);
        toast.success('Factura actualizada exitosamente');
      } else {
        await createInvoice(data);
        toast.success('Factura creada exitosamente');
      }
      navigate('/invoices');
    } catch (error) {
      toast.error(error.message || 'Error al guardar la factura');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/invoices')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Factura' : 'Nueva Factura'}
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información básica */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Información de la Factura</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <select
                  {...register('client_id', { required: 'El cliente es requerido' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Seleccionar cliente</option>
                  {clients?.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {errors.client_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de emisión *
                </label>
                <input
                  {...register('issue_date', { required: 'La fecha de emisión es requerida' })}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.issue_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.issue_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de vencimiento *
                </label>
                <input
                  {...register('due_date', { required: 'La fecha de vencimiento es requerida' })}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.due_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Items de la factura */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Items de la Factura</h2>
              <button
                type="button"
                onClick={addItem}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md flex items-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                Agregar Item
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Producto
                      </label>
                      <select
                        {...register(`items.${index}.product_id`)}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Seleccionar producto</option>
                        {products?.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad
                      </label>
                      <input
                        {...register(`items.${index}.quantity`, {
                          required: 'La cantidad es requerida',
                          min: { value: 1, message: 'La cantidad debe ser mayor a 0' }
                        })}
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio Unitario
                      </label>
                      <input
                        {...register(`items.${index}.unit_price`, {
                          required: 'El precio es requerido',
                          min: { value: 0, message: 'El precio debe ser mayor o igual a 0' }
                        })}
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total
                      </label>
                      <input
                        type="text"
                        value={`$${calculateItemTotal(index).toFixed(2)}`}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={fields.length === 1}
                        className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <input
                      {...register(`items.${index}.description`)}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Descripción del item"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Totales</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IVA (16%):</span>
                <span className="font-medium">${calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/invoices')}
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
              {isLoading ? 'Guardando...' : 'Guardar Factura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm; 