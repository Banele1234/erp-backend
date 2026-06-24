import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import CustomerList from './components/customers/CustomerList';
import ProductList from './components/products/ProductList';
import InventoryManagement from './components/inventory/InventoryManagement';
import WarehouseManagement from './components/warehouses/WarehouseManagement';
import OrderManagement from './components/orders/OrderManagement';
import InvoiceManagement from './components/invoices/InvoiceManagement';
import PaymentManagement from './components/payments/PaymentManagement';
import RejectionManagement from './components/rejections/RejectionManagement';
import ProductionTrackingManagement from './components/production/ProductionTracking';
import NotificationList from './components/notifications/NotificationList';
import SettingsPage from './components/common/SettingsPage';
import ProfilePage from './components/common/ProfilePage';
import Reports from './components/reports/Reports';
import UserManagement from './components/users/UserManagement';
import DispatchesPage from './components/dispatches/DispatchesPage';
import NotFoundPage from './components/common/NotFoundPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function RoleRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  return allowedRoles.includes(user.role) ? <>{children}</> : <Navigate to="/" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/customers" element={<RoleRoute allowedRoles={['admin', 'management']}><Layout><CustomerList /></Layout></RoleRoute>} />
      <Route path="/products" element={<RoleRoute allowedRoles={['admin', 'management', 'warehouse_staff']}><Layout><ProductList /></Layout></RoleRoute>} />
      <Route path="/inventory" element={<RoleRoute allowedRoles={['admin', 'management', 'warehouse_staff']}><Layout><InventoryManagement /></Layout></RoleRoute>} />
      <Route path="/warehouses" element={<RoleRoute allowedRoles={['admin', 'management']}><Layout><WarehouseManagement /></Layout></RoleRoute>} />
      <Route path="/orders" element={<RoleRoute allowedRoles={['admin', 'management', 'warehouse_staff', 'production', 'customer']}><Layout><OrderManagement /></Layout></RoleRoute>} />
      <Route path="/invoices" element={<RoleRoute allowedRoles={['admin', 'management', 'warehouse_staff', 'customer']}><Layout><InvoiceManagement /></Layout></RoleRoute>} />
      <Route path="/payments" element={<RoleRoute allowedRoles={['admin', 'management', 'customer']}><Layout><PaymentManagement /></Layout></RoleRoute>} />
      <Route path="/rejections" element={<RoleRoute allowedRoles={['admin', 'management', 'warehouse_staff', 'production']}><Layout><RejectionManagement /></Layout></RoleRoute>} />
      <Route path="/production" element={<RoleRoute allowedRoles={['admin', 'management', 'production']}><Layout><ProductionTrackingManagement /></Layout></RoleRoute>} />
      <Route path="/notifications" element={<RoleRoute allowedRoles={['admin', 'management', 'warehouse_staff', 'production', 'customer']}><Layout><NotificationList /></Layout></RoleRoute>} />
      <Route path="/reports" element={<RoleRoute allowedRoles={['admin', 'management']}><Layout><Reports /></Layout></RoleRoute>} />
      <Route path="/dispatches" element={<RoleRoute allowedRoles={['admin', 'management', 'warehouse_staff']}><Layout><DispatchesPage /></Layout></RoleRoute>} />
      <Route path="/users" element={<RoleRoute allowedRoles={['admin']}><Layout><UserManagement /></Layout></RoleRoute>} />
      <Route path="/settings" element={<PrivateRoute><Layout><SettingsPage /></Layout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Layout><ProfilePage /></Layout></PrivateRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
