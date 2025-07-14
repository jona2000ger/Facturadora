import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const ErrorModal = ({ isOpen, onClose, title, message, type = 'error' }) => {
  console.log('ErrorModal render:', { isOpen, title, message, type }); // Debug

  if (!isOpen) {
    console.log('Modal no está abierto');
    return null;
  }

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
      case 'info':
        return <Info className="h-8 w-8 text-blue-500" />;
      default:
        return <AlertCircle className="h-8 w-8 text-red-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-red-50 border-red-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-red-800';
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 transform transition-all"
        style={{
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        <div className={`${getBgColor()} px-6 py-4 border-l-4 rounded-t-lg`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-4 w-0 flex-1">
              <h3 className={`text-xl font-semibold ${getTextColor()}`}>
                {title}
              </h3>
              <div className={`mt-3 text-base ${getTextColor()}`}>
                <p>{message}</p>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={onClose}
                className={`inline-flex rounded-md p-2 ${getTextColor()} hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-3 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Usar React Portal para renderizar el modal fuera del flujo normal
  return createPortal(modalContent, document.body);
};

export default ErrorModal; 