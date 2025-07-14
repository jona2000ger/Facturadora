import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, FileText, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import electronicDocumentService from '../models/electronicDocumentService';

const ElectronicDocumentStatus = ({ invoiceId, onStatusChange }) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadDocument();
  }, [invoiceId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const response = await electronicDocumentService.getElectronicDocument(invoiceId);
      setDocument(response.data);
    } catch (error) {
      // Si no existe documento, no mostrar error
      if (!error.message.includes('no encontrado')) {
        console.error('Error cargando documento electrónico:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateDocument = async () => {
    try {
      setGenerating(true);
      const response = await electronicDocumentService.generateElectronicDocument(invoiceId);
      setDocument(response.data.document);
      toast.success('Documento electrónico generado exitosamente');
      if (onStatusChange) {
        onStatusChange('sent');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setGenerating(false);
    }
  };

  const downloadXML = async () => {
    try {
      await electronicDocumentService.downloadXML(invoiceId);
      toast.success('XML descargado exitosamente');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const resendToSRI = async () => {
    try {
      const response = await electronicDocumentService.resendToSRI(invoiceId);
      setDocument(response.data);
      toast.success('Documento reenviado al SRI exitosamente');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'AUTORIZADO':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'RECHAZADO':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AUTORIZADO':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'RECHAZADO':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'PENDING':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <RefreshCw className="h-5 w-5 animate-spin text-gray-500" />
        <span className="ml-2 text-sm text-gray-600">Cargando estado electrónico...</span>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Documento Electrónico</span>
          </div>
          <button
            onClick={generateDocument}
            disabled={generating}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                Generando...
              </>
            ) : (
              'Generar'
            )}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          No se ha generado el documento electrónico para esta factura.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-sm font-medium text-gray-700">Documento Electrónico</span>
        </div>
        <div className="flex items-center space-x-2">
          {document.status === 'RECHAZADO' && (
            <button
              onClick={resendToSRI}
              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reenviar
            </button>
          )}
          <button
            onClick={downloadXML}
            className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="h-3 w-3 mr-1" />
            XML
          </button>
        </div>
      </div>

      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(document.status)}`}>
        {getStatusIcon(document.status)}
        <span className="ml-1">{document.status}</span>
      </div>

      {document.authorization_number && (
        <div className="mt-2 text-sm">
          <span className="text-gray-500">Autorización:</span>
          <span className="ml-1 font-mono text-gray-700">{document.authorization_number}</span>
        </div>
      )}

      {document.access_key && (
        <div className="mt-1 text-sm">
          <span className="text-gray-500">Clave de Acceso:</span>
          <span className="ml-1 font-mono text-gray-700">{document.access_key}</span>
        </div>
      )}

      {document.authorization_date && (
        <div className="mt-1 text-sm">
          <span className="text-gray-500">Fecha de Autorización:</span>
          <span className="ml-1 text-gray-700">
            {new Date(document.authorization_date).toLocaleDateString('es-EC')}
          </span>
        </div>
      )}

      {document.sri_response?.mensajes && document.sri_response.mensajes.length > 0 && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
          <span className="text-gray-500 font-medium">Mensajes del SRI:</span>
          <ul className="mt-1 space-y-1">
            {document.sri_response.mensajes.map((mensaje, index) => (
              <li key={index} className="text-gray-600">
                {mensaje}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ElectronicDocumentStatus; 