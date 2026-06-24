import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/api';
import {
  LayoutDashboard,
  Users,
  Package,
  Warehouse,
  ClipboardList,
  FileText,
  CreditCard,
  AlertTriangle,
  Factory,
  Truck,
  Bell,
  Settings,
  UserCircle,
  Users2,
  BarChart3,
} from 'lucide-react';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'management', 'warehouse_staff', 'production'] },
  { path: '/customers', icon: Users, label: 'Customers', roles: ['admin', 'management'] },
  { path: '/products', icon: Package, label: 'Products', roles: ['admin', 'management', 'warehouse_staff'] },
  { path: '/inventory', icon: Warehouse, label: 'Inventory', roles: ['admin', 'management', 'warehouse_staff'] },
  { path: '/warehouses', icon: Warehouse, label: 'Warehouses', roles: ['admin', 'management'] },
  { path: '/orders', icon: ClipboardList, label: 'Orders', roles: ['admin', 'management', 'warehouse_staff', 'production', 'customer'] },
  { path: '/invoices', icon: FileText, label: 'Invoices', roles: ['admin', 'management', 'warehouse_staff', 'customer'] },
  { path: '/payments', icon: CreditCard, label: 'Payments', roles: ['admin', 'management', 'customer'] },
  { path: '/rejections', icon: AlertTriangle, label: 'Rejections', roles: ['admin', 'management', 'warehouse_staff', 'production'] },
  { path: '/production', icon: Factory, label: 'Production', roles: ['admin', 'management', 'production'] },
  { path: '/dispatches', icon: Truck, label: 'Dispatches', roles: ['admin', 'management', 'warehouse_staff'] },
  { path: '/notifications', icon: Bell, label: 'Notifications', roles: ['admin', 'management', 'warehouse_staff', 'production', 'customer'] },
  { path: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin', 'management'] },
  { path: '/users', icon: Users2, label: 'Users', roles: ['admin'] },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notifications count
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await apiService.getNotifications(true); // true = unread only
        setUnreadCount(res.data?.length || 0);
      } catch (e) {
        console.error('Failed to fetch unread count:', e);
      }
    };
    fetchUnread();

    // Optional: refresh every 30 seconds
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const filteredMenu = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-slate-900 fixed left-0 top-0 bottom-0 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
            <Factory className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">AAL</h1>
            <p className="text-slate-400 text-xs">ERP System</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 mb-2">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Main Menu</p>
        </div>
        <ul className="space-y-1 px-2">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            // Special handling for Notifications – show badge
            const isNotifications = item.path === '/notifications';

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {isNotifications && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        {/* Settings – only visible to admins */}
        {user?.role === 'admin' && (
          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>
        )}
        {/* Profile – visible to everyone */}
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
        >
          <UserCircle className="w-5 h-5" />
          <span className="font-medium">Profile</span>
        </Link>
      </div>
    </aside>
  );
}