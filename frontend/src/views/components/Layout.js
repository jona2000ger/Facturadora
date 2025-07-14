import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../controllers/useAuth';
import { 
  Home, 
  Users, 
  Package, 
  FileText, 
  Menu, 
  X, 
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Settings,
  ChevronDown
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Auto-colapsar sidebar solo en desktop después de 3 segundos de inactividad
  useEffect(() => {
    if (isMobile) return; // No auto-colapsar en móviles

    let timeoutId;
    
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      if (!sidebarCollapsed) {
        timeoutId = setTimeout(() => {
          setSidebarCollapsed(true);
        }, 3000);
      }
    };

    // Resetear timeout en interacciones del usuario
    const handleUserActivity = () => {
      resetTimeout();
    };

    // Eventos para detectar actividad del usuario
    document.addEventListener('mousemove', handleUserActivity);
    document.addEventListener('click', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);

    // Iniciar timeout
    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousemove', handleUserActivity);
      document.removeEventListener('click', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
    };
  }, [sidebarCollapsed, isMobile]);

  // Cerrar sidebar móvil al cambiar de ruta
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Cerrar menú de perfil al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuOpen && !event.target.closest('.profile-menu')) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [profileMenuOpen]);

  // Definir navegación basada en el rol del usuario
  const getNavigation = () => {
    const baseNavigation = [
      { name: 'Dashboard', href: '/dashboard', icon: Home, permission: 'dashboard' }
    ];

    // Agregar opciones según el rol
    if (user?.role === 'admin') {
      // Admin tiene acceso completo
      return [
        ...baseNavigation,
        { name: 'Clientes', href: '/clients', icon: Users, permission: 'clients' },
        { name: 'Productos', href: '/products', icon: Package, permission: 'products' },
        { name: 'Facturas', href: '/invoices', icon: FileText, permission: 'invoices' },
        { name: 'Admin Dashboard', href: '/admin/dashboard', icon: Home, permission: 'admin' },
        { name: 'Admin Facturas', href: '/admin/invoices', icon: FileText, permission: 'admin' },
      ];
    } else if (user?.role === 'manager') {
      // Manager tiene acceso a facturas, clientes, productos y reportes
      return [
        ...baseNavigation,
        { name: 'Clientes', href: '/clients', icon: Users, permission: 'clients' },
        { name: 'Productos', href: '/products', icon: Package, permission: 'products' },
        { name: 'Facturas', href: '/invoices', icon: FileText, permission: 'invoices' },
      ];
    } else {
      // User tiene acceso básico: dashboard, facturas, clientes y productos
      return [
        ...baseNavigation,
        { name: 'Clientes', href: '/clients', icon: Users, permission: 'clients' },
        { name: 'Productos', href: '/products', icon: Package, permission: 'products' },
        { name: 'Facturas', href: '/invoices', icon: FileText, permission: 'invoices' },
      ];
    }
  };

  const navigation = getNavigation();

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar móvil - Overlay completo */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        {/* Overlay oscuro */}
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity duration-300" 
          onClick={() => setSidebarOpen(false)} 
        />
        
        {/* Sidebar móvil */}
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white transform transition-transform duration-300 ease-in-out">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Facturadora</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          {/* Footer del sidebar móvil */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role || 'Usuario'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar desktop - Solo visible en lg y superior */}
      <div className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 hidden lg:flex ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 justify-between">
            {!sidebarCollapsed && (
              <h1 className="text-xl font-bold text-gray-900">Facturadora</h1>
            )}
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              title={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={sidebarCollapsed ? item.name : ""}
                >
                  <Icon className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                  {!sidebarCollapsed && (
                    <span className="transition-opacity duration-200">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      }`}>
        {/* Header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          {/* Botón de menú móvil */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={24} />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Menú de perfil */}
              <div className="relative profile-menu">
                <button
                  onClick={toggleProfileMenu}
                  className="flex items-center gap-x-3 text-sm font-medium text-gray-900 hover:text-gray-700"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  {!sidebarCollapsed && (
                    <>
                      <span className="hidden lg:block">
                        {user?.first_name} {user?.last_name}
                      </span>
                      <ChevronDown size={16} className="text-gray-400" />
                    </>
                  )}
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50">
                    {/* Información del perfil */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-x-3">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                          <User size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user?.first_name} {user?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {user?.email}
                          </p>
                          <p className="text-xs text-gray-400 capitalize">
                            {user?.role || 'Usuario'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Opciones del menú */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          navigate('/profile');
                        }}
                        className="flex items-center gap-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <User size={16} className="text-gray-400" />
                        Ver Perfil
                      </button>
                      
                      {(user?.role === 'admin') && (
                        <button
                          onClick={() => {
                            setProfileMenuOpen(false);
                            navigate('/settings');
                          }}
                          className="flex items-center gap-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <Settings size={16} className="text-gray-400" />
                          Configuración
                        </button>
                      )}
                    </div>

                    {/* Separador */}
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-x-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut size={16} className="text-red-400" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido de la página */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 