import React, { useState, Suspense, useMemo, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import Chatbot from '@/components/Chatbot';
import { useDarkMode } from '@/hooks/useDarkMode';
import LoadingSpinner from '@/components/icons/LoadingSpinner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { InventoryProvider } from '@/contexts/InventoryContext';
import { VendorProvider } from '@/contexts/VendorContext';
import { AssetProvider } from '@/contexts/AssetContext'; // New
import ProtectedRoute from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ALL_NAV_ITEMS } from '@/constants';
import AccessDeniedPage from '@/pages/AccessDeniedPage';
import { initializeServiceWorker } from '@/utils/serviceWorker';

// Lazy load page components using aliases
const LoginPage = React.lazy(() => import('@/pages/LoginPage'));
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));
const IncomingShipmentsPage = React.lazy(() => import('@/pages/IncomingShipmentsPage'));
const InventoryManagementPage = React.lazy(() => import('@/pages/InventoryManagementPage'));
const WarehouseOrdersPage = React.lazy(() => import('@/pages/WarehouseOrdersPage'));
const DispatchLogisticsPage = React.lazy(() => import('@/pages/DispatchLogisticsPage'));
const VendorManagementPage = React.lazy(() => import('@/pages/VendorManagementPage'));
const WarehouseManagementPage = React.lazy(() => import('@/pages/WarehouseManagementPage'));
const ReportingPage = React.lazy(() => import('@/pages/ReportingPage'));
const NotificationsPage = React.lazy(() => import('@/pages/NotificationsPage'));
const AssetManagementPage = React.lazy(() => import('@/pages/AssetManagementPage'));
const MasterDataPage = React.lazy(() => import('@/pages/MasterDataPage'));
const UserManagementPage = React.lazy(() => import('@/pages/UserManagementPage'));
const CustomerSupportPage = React.lazy(() => import('@/pages/CustomerSupportPage'));
const HelpPage = React.lazy(() => import('@/pages/HelpPage'));
const CompliancePage = React.lazy(() => import('@/pages/CompliancePage'));


const PageLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
    <div className="text-center">
      <LoadingSpinner className="w-12 h-12 text-primary-500 mx-auto mb-3" />
      <p className="text-lg font-medium text-secondary-600 dark:text-secondary-400">Loading page...</p>
    </div>
  </div>
);

// Memoize the route permissions mapping for better performance
const useRoutePermissions = () => {
  return useMemo(() => {
    return ALL_NAV_ITEMS.reduce((acc, item) => {
      const pathKey = item.path.startsWith('/') ? item.path.substring(1) : item.path;
      if (pathKey) {
        acc[pathKey] = item.permission;
      }
      return acc;
    }, {} as Record<string, string>);
  }, []);
};


const App: React.FC = () => {
  useEffect(() => {
    // Initialize service worker for PWA features
    initializeServiceWorker().catch(console.error);
  }, []);

  return (
    <ErrorBoundary>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  );
};


const MainApp: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary-100 dark:bg-secondary-900">
        <div className="text-center">
          <LoadingSpinner className="w-12 h-12 text-primary-500 mx-auto mb-3" />
          <p className="text-lg font-medium text-secondary-600 dark:text-secondary-400">Authenticating...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <ErrorBoundary fallback={
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <div>Error loading page or module.<br/>This may be due to a missing or outdated chunk file.<br/></div>
          <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      }>
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              element={
                <ProtectedRoute>
                  <InventoryProvider>
                    <VendorProvider>
                      <AssetProvider>
                        <AppLayout />
                      </AssetProvider>
                    </VendorProvider>
                  </InventoryProvider>
                </ProtectedRoute>
              } 
            >
              {/* Nested routes are now protected and will render inside AppLayout's <Outlet /> */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="incoming-shipments" element={<ProtectedRoute><IncomingShipmentsPage /></ProtectedRoute>} />
              <Route path="inventory" element={<ProtectedRoute><InventoryManagementPage /></ProtectedRoute>} />
              <Route path="orders" element={<ProtectedRoute><WarehouseOrdersPage /></ProtectedRoute>} />
              <Route path="dispatch" element={<ProtectedRoute><DispatchLogisticsPage /></ProtectedRoute>} />
              <Route path="warehouse-management" element={<ProtectedRoute><WarehouseManagementPage /></ProtectedRoute>} />
              <Route path="vendors" element={<ProtectedRoute><VendorManagementPage /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute><ReportingPage /></ProtectedRoute>} />
              <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="assets" element={<ProtectedRoute><AssetManagementPage /></ProtectedRoute>} />
              <Route path="compliance" element={<ProtectedRoute><CompliancePage /></ProtectedRoute>} />
              <Route path="master-data" element={<ProtectedRoute><MasterDataPage /></ProtectedRoute>} />
              <Route path="user-management" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
              <Route path="customer-support" element={<ProtectedRoute><CustomerSupportPage /></ProtectedRoute>} />
              <Route path="help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};


const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const routePermissions = useRoutePermissions();

  // Auth check is now handled by the parent ProtectedRoute component.
  // We can safely assume `user` is not null here.
  const pathSegment = location.pathname.split('/')[1] || 'dashboard';
  const requiredPermission = routePermissions[pathSegment];
  const hasPermission = user!.role === 'admin' || (requiredPermission && user!.permissions.includes(requiredPermission));

  return (
    <>
      <Layout 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode}
      >
        {/* Suspense inside the layout provides a better UX as the app frame remains visible */}
        <Suspense fallback={<PageLoadingFallback />}>
            {hasPermission ? <Outlet /> : <AccessDeniedPage />}
        </Suspense>
      </Layout>
      <Chatbot />
    </>
  );
};

export default App;
