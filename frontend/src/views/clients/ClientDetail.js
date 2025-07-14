import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, FileText, Calendar } from 'lucide-react';
import { useClients } from '../../controllers/useClients';
import LoadingSpinner from '../components/LoadingSpinner';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { useClient, deleteClient } = useClients();
  const { data: client, isLoading, error } = useClient(id);

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        await deleteClient(id);
        navigate('/clients');
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
      }
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">Error al cargar el cliente</p>
          <button
            onClick={() => navigate('/clients')}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }
  if (!client) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Cliente no encontrado</p>
          <button
            onClick={() => navigate('/clients')}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/clients')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Detalles del Cliente</h1>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/clients/${id}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Link>
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          </div>
        </div>

        {/* Información del cliente */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Header con avatar */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{client.name}</h2>
                <p className="text-indigo-100">Cliente</p>
              </div>
            </div>
          </div>

          {/* Detalles */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información de contacto */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h3>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{client.email || 'No especificado'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="text-gray-900">{client.phone || 'No especificado'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Dirección</p>
                    <p className="text-gray-900">{client.address || 'No especificada'}</p>
                  </div>
                </div>
              </div>

              {/* Información fiscal y fechas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Fiscal</h3>
                
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">RFC</p>
                    <p className="text-gray-900">{client.tax_id || 'No especificado'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Fecha de registro</p>
                    <p className="text-gray-900">
                      {client.created_at ? new Date(client.created_at).toLocaleDateString('es-MX') : 'No disponible'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Última actualización</p>
                    <p className="text-gray-900">
                      {client.updated_at ? new Date(client.updated_at).toLocaleDateString('es-MX') : 'No disponible'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Estado del cliente */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${client.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {client.is_active ? 'Cliente activo' : 'Cliente inactivo'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de facturas (opcional) */}
        <div className="mt-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Facturas del Cliente</h3>
            <p className="text-gray-600">Aquí se mostrarían las facturas asociadas a este cliente.</p>
            <p className="text-sm text-gray-500 mt-2">Funcionalidad en desarrollo...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail; 