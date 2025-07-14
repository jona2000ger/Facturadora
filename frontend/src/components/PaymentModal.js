import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, DollarSign, Calendar, CreditCard, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, invoice, onPaymentSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      amount: invoice?.total_amount || 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'transfer',
      reference_number: '',
      notes: ''
    }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await onPaymentSuccess(data);
      reset();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Error al registrar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Registrar Pago</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">Factura: {invoice?.invoice_number}</p>
          <p className="text-sm text-gray-600">Cliente: {invoice?.client_name}</p>
          <p className="text-lg font-semibold text-gray-900">
            Total: ${parseFloat(invoice?.total_amount || 0).toFixed(2)}
          </p>
          {invoice?.admin_status === 'rejected' && (
            <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-md">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ Esta factura ha sido rechazada administrativamente y no puede ser pagada.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto a pagar *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                {...register('amount', {
                  required: 'El monto es requerido',
                  min: { value: 0.01, message: 'El monto debe ser mayor a 0' }
                })}
                type="number"
                step="0.01"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de pago *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                {...register('payment_date', { required: 'La fecha es requerida' })}
                type="date"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.payment_date && (
              <p className="mt-1 text-sm text-red-600">{errors.payment_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de pago *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                {...register('payment_method', { required: 'El método de pago es requerido' })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar método</option>
                <option value="transfer">Transferencia bancaria</option>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta de crédito/débito</option>
                <option value="check">Cheque</option>
                <option value="other">Otro</option>
              </select>
            </div>
            {errors.payment_method && (
              <p className="mt-1 text-sm text-red-600">{errors.payment_method.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de referencia
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                {...register('reference_number')}
                type="text"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Número de transferencia, cheque, etc."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notas adicionales sobre el pago"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || invoice?.admin_status === 'rejected'}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Registrando...' : 
               invoice?.admin_status === 'rejected' ? 'Factura Rechazada' : 
               'Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal; 