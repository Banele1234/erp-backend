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
      <Route path="/customers" element={<PrivateRoute><Layout><CustomerList /></Layout></PrivateRoute>} />
      <Route path="/products" element={<PrivateRoute><Layout><ProductList /></Layout></PrivateRoute>} />
      <Route path="/inventory" element={<PrivateRoute><Layout><InventoryManagement /></Layout></PrivateRoute>} />
      <Route path="/warehouses" element={<PrivateRoute><Layout><WarehouseManagement /></Layout></PrivateRoute>} />
      <Route path="/orders" element={<PrivateRoute><Layout><OrderManagement /></Layout></PrivateRoute>} />
      <Route path="/invoices" element={<PrivateRoute><Layout><InvoiceManagement /></Layout></PrivateRoute>} />
      <Route path="/payments" element={<PrivateRoute><Layout><PaymentManagement /></Layout></PrivateRoute>} />
      <Route path="/rejections" element={<PrivateRoute><Layout><RejectionManagement /></Layout></PrivateRoute>} />
      <Route path="/production" element={<PrivateRoute><Layout><ProductionTrackingManagement /></Layout></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><Layout><NotificationList /></Layout></PrivateRoute>} />
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
