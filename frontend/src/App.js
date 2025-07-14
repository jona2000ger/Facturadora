import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './controllers/useAuth';
import Layout from './views/components/Layout';
import Login from './views/auth/Login';
import Register from './views/auth/Register';
import Dashboard from './views/dashboard/Dashboard';
import Clients from './views/clients/Clients';
import ClientForm from './views/clients/ClientForm';
import ClientDetail from './views/clients/ClientDetail';
import Products from './views/products/Products';
import ProductForm from './views/products/ProductForm';
import Invoices from './views/invoices/Invoices';
import InvoiceForm from './views/invoices/InvoiceForm';
import InvoiceDetail from './views/invoices/InvoiceDetail';
import AdminDashboard from './views/admin/AdminDashboard';
import AdminInvoices from './views/admin/AdminInvoices';
import UserProfile from './views/profile/UserProfile';
import UserSettings from './views/settings/UserSettings';
import LoadingSpinner from './views/components/LoadingSpinner';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Componente para rutas públicas (solo para usuarios no autenticados)
const PublicRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Componente para rutas que requieren rol específico
const RoleRoute = ({ children, allowedRoles = [] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Componente para rutas que requieren permiso específico
const PermissionRoute = ({ children, requiredPermission }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permisos según el rol
  const hasPermission = () => {
    switch (user.role) {
      case 'admin':
        return true; // Admin tiene todos los permisos
      case 'manager':
        return ['dashboard', 'invoices', 'clients', 'products', 'reports'].includes(requiredPermission);
      case 'user':
        return ['dashboard', 'invoices', 'clients', 'products'].includes(requiredPermission);
      default:
        return false;
    }
  };

  if (!hasPermission()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Rutas públicas */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />

        {/* Rutas protegidas */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard - accesible para todos los roles */}
          <Route path="dashboard" element={
            <PermissionRoute requiredPermission="dashboard">
              <Dashboard />
            </PermissionRoute>
          } />
          
          {/* Clientes - accesible para admin, manager y user */}
          <Route path="clients" element={
            <PermissionRoute requiredPermission="clients">
              <Clients />
            </PermissionRoute>
          } />
          <Route path="clients/new" element={
            <PermissionRoute requiredPermission="clients">
              <ClientForm />
            </PermissionRoute>
          } />
          <Route path="clients/:id/edit" element={
            <PermissionRoute requiredPermission="clients">
              <ClientForm />
            </PermissionRoute>
          } />
          <Route path="clients/:id" element={
            <PermissionRoute requiredPermission="clients">
              <ClientDetail />
            </PermissionRoute>
          } />
          
          {/* Productos - accesible solo para admin y manager */}
          <Route path="products" element={
            <PermissionRoute requiredPermission="products">
              <Products />
            </PermissionRoute>
          } />
          <Route path="products/new" element={
            <PermissionRoute requiredPermission="products">
              <ProductForm />
            </PermissionRoute>
          } />
          <Route path="products/:id/edit" element={
            <PermissionRoute requiredPermission="products">
              <ProductForm />
            </PermissionRoute>
          } />
          
          {/* Facturas - accesible para admin, manager y user */}
          <Route path="invoices" element={
            <PermissionRoute requiredPermission="invoices">
              <Invoices />
            </PermissionRoute>
          } />
          <Route path="invoices/new" element={
            <PermissionRoute requiredPermission="invoices">
              <InvoiceForm />
            </PermissionRoute>
          } />
          <Route path="invoices/:id" element={
            <PermissionRoute requiredPermission="invoices">
              <InvoiceDetail />
            </PermissionRoute>
          } />
          
          {/* Rutas de Administración - solo para admin */}
          <Route path="admin/dashboard" element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          } />
          <Route path="admin/invoices" element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminInvoices />
            </RoleRoute>
          } />
          
          {/* Rutas de Perfil y Configuración */}
          <Route path="profile" element={<UserProfile />} />
          <Route path="settings" element={
            <RoleRoute allowedRoles={['admin']}>
              <UserSettings />
            </RoleRoute>
          } />
        </Route>

        {/* Ruta de fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App; 