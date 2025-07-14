import { useQuery } from 'react-query';
import { useInvoices } from './useInvoices';
import { useClients } from './useClients';
import { useProducts } from './useProducts';

export const useDashboard = () => {
  const { invoices, isLoading: invoicesLoading, refetchInvoices } = useInvoices();
  const { clients, isLoading: clientsLoading, refetch } = useClients();
  const { products, isLoading: productsLoading, refetchProducts } = useProducts();

  // Calcular estadísticas
  const dashboardData = {
    totalInvoices: Array.isArray(invoices) ? invoices.length : 0,
    totalClients: Array.isArray(clients) ? clients.length : 0,
    totalProducts: Array.isArray(products) ? products.length : 0,
    totalRevenue: Array.isArray(invoices) ? invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + parseFloat(invoice.total_amount || 0), 0) : 0
  };

  // Log para debuggear
  console.log('Dashboard Data:', {
    invoices: invoices?.length || 0,
    clients: clients?.length || 0,
    products: products?.length || 0,
    dashboardData
  });

  // Facturas recientes (últimas 5)
  const recentInvoices = Array.isArray(invoices) ? invoices
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5) : [];

  // Productos con bajo stock (menos de 10 unidades)
  const lowStockProducts = Array.isArray(products) ? products.filter(product => 
    product.stock_quantity < 10 && product.stock_quantity > 0
  ) : [];

  // Facturas pendientes
  const pendingInvoices = Array.isArray(invoices) ? invoices.filter(invoice => 
    invoice.status === 'sent' || invoice.status === 'draft'
  ) : [];

  const refetchDashboard = async () => {
    console.log('Refetching dashboard data...');
    await Promise.all([
      refetchInvoices(),
      refetch(),
      refetchProducts()
    ]);
    console.log('Dashboard data refetched');
  };

  return {
    dashboardData,
    recentInvoices,
    lowStockProducts,
    pendingInvoices,
    isLoading: invoicesLoading || clientsLoading || productsLoading,
    error: null,
    refetch: refetchDashboard
  };
}; 