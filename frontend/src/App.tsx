import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';

import { PortalShell }          from './components/layout/PortalShell';
import { DevPortalShell }       from './components/layout/DevPortalShell';
import { AgeVerificationGate }  from './components/AgeVerificationGate';

import { Login }        from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';

import { ProductCatalog } from './pages/portal/ProductCatalog';
import { OrderList }      from './pages/portal/OrderList';
import { OrderDetail }    from './pages/portal/OrderDetail';
import { PlaceOrder }     from './pages/portal/PlaceOrder';
import { InvoiceList }    from './pages/portal/InvoiceList';

import { ApiCatalog }    from './pages/devportal/ApiCatalog';
import { ApiKeyManager } from './pages/devportal/ApiKeyManager';
import { Playground }    from './pages/devportal/Playground';
import { Onboarding }    from './pages/devportal/Onboarding';
import { AdminPanel }    from './pages/devportal/AdminPanel';

import { AdminShell }     from './pages/admin/AdminShell';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminOrders }    from './pages/admin/AdminOrders';
import { AdminApiKeys }   from './pages/admin/AdminApiKeys';

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"         element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            <Route path="/portal" element={<AgeVerificationGate><PortalShell /></AgeVerificationGate>}>
              <Route index element={<Navigate to="catalog" replace />} />
              <Route path="catalog"      element={<ProductCatalog />} />
              <Route path="orders"       element={<OrderList />} />
              <Route path="orders/new"   element={<PlaceOrder />} />
              <Route path="orders/:id"   element={<OrderDetail />} />
              <Route path="invoices"     element={<InvoiceList />} />
              <Route path="shipments"    element={<Navigate to="../orders" replace />} />
            </Route>

            <Route path="/devportal" element={<DevPortalShell />}>
              <Route index element={<Navigate to="apis" replace />} />
              <Route path="apis"        element={<ApiCatalog />} />
              <Route path="keys"        element={<ApiKeyManager />} />
              <Route path="playground"  element={<Playground />} />
              <Route path="onboarding"  element={<Onboarding />} />
              <Route path="admin"       element={<AdminPanel />} />
            </Route>

            <Route path="/admin" element={<AdminShell />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="orders"    element={<AdminOrders />} />
              <Route path="api-keys"  element={<AdminApiKeys />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
