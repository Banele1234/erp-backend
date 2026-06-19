import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, StatCard, Badge, Button, LoadingSpinner } from '../common/StatusBadge';
import { Order, Customer, Product, Invoice, DashboardStats } from '../../types';
import {
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  Factory,
  ArrowRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Dashboard() {
  const { user, customer } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user, customer]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      if (user?.role === 'customer' && customer) {
        await fetchCustomerDashboard();
      } else {
        await fetchAdminDashboard();
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
    setIsLoading(false);
  };

  const fetchCustomerDashboard = async () => {
    if (!customer) return;

    const [ordersRes, invoicesRes, paymentsRes] = await Promise.all([
      supabase.from('orders').select('*, items:order_items(*)').eq('customer_id', customer.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('invoices').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }),
      supabase.from('payments').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }),
    ]);

    const totalOrders = ordersRes.data?.length || 0;
    const pendingOrders = ordersRes.data?.filter(o => o.status === 'pending' || o.status === 'confirmed').length || 0;
    const totalAmount = ordersRes.data?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
    const outstanding = invoicesRes.data?.filter(i => i.payment_status !== 'paid').reduce((sum, i) => sum + i.amount_due, 0) || 0;

    setStats({
      totalOrders,
      pendingOrders,
      totalRevenue: totalAmount,
      outstandingPayments: outstanding,
      lowStockProducts: 0,
      totalCustomers: 1,
      monthlyGrowth: 0,
      recentOrders: ordersRes.data || [],
      topProducts: [],
    });
  };

  const fetchAdminDashboard = async () => {
    const [ordersRes, customersRes, productsRes, invoicesRes, inventoryRes] = await Promise.all([
      supabase.from('orders').select('*, customer:customers(*)').order('created_at', { ascending: false }).limit(10),
      supabase.from('customers').select('*'),
      supabase.from('products').select('*'),
      supabase.from('invoices').select('*'),
      supabase.from('inventory').select('*, product:products(*)').lt('quantity', 100),
    ]);

    const orders = ordersRes.data || [];
    const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const outstanding = invoicesRes.data?.filter(i => i.payment_status !== 'paid').reduce((sum, i) => sum + i.amount_due, 0) || 0;

    setStats({
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      totalRevenue,
      outstandingPayments: outstanding,
      lowStockProducts: inventoryRes.data?.length || 0,
      totalCustomers: customersRes.data?.length || 0,
      monthlyGrowth: 12.5,
      recentOrders: orders.slice(0, 5),
      topProducts: [],
    });

    const monthlySales = [
      { month: 'Jan', sales: 45000, orders: 45 },
      { month: 'Feb', sales: 52000, orders: 52 },
      { month: 'Mar', sales: 48000, orders: 48 },
      { month: 'Apr', sales: 61000, orders: 61 },
      { month: 'May', sales: 55000, orders: 55 },
      { month: 'Jun', sales: 67000, orders: 67 },
    ];
    setSalesData(monthlySales);

    const categories = [
      { name: 'Fast Moving', value: 35 },
      { name: 'Regular', value: 40 },
      { name: 'Seasonal', value: 15 },
      { name: 'Slow Moving', value: 10 },
    ];
    setCategoryData(categories);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'warning',
      confirmed: 'info',
      in_production: 'primary',
      quality_check: 'info',
      ready_for_dispatch: 'info',
      in_transit: 'primary',
      delivered: 'success',
      cancelled: 'danger',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      pending: Clock,
      confirmed: CheckCircle,
      in_production: Factory,
      ready_for_dispatch: Package,
      in_transit: Truck,
      delivered: CheckCircle,
    };
    return icons[status] || Clock;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user?.role === 'customer') {
    return <CustomerDashboard stats={stats} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user?.full_name}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Clock className="w-4 h-4 mr-2" />
            Today
          </Button>
          <Button>
            <TrendingUp className="w-4 h-4 mr-2" />
            View Reports
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          change={stats?.monthlyGrowth}
          icon={<DollarSign className="w-6 h-6 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={<ShoppingCart className="w-6 h-6 text-emerald-600" />}
          iconBg="bg-emerald-100"
        />
        <StatCard
          title="Active Customers"
          value={stats?.totalCustomers || 0}
          icon={<Users className="w-6 h-6 text-amber-600" />}
          iconBg="bg-amber-100"
        />
        <StatCard
          title="Outstanding Payments"
          value={formatCurrency(stats?.outstandingPayments || 0)}
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          iconBg="bg-red-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Sales Overview</h3>
            <select className="text-sm border rounded-lg px-3 py-1.5">
              <option>Last 6 months</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Product Categories</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-medium text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Orders</h3>
            <a href="/orders" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <div className="space-y-3">
            {stats?.recentOrders?.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{order.order_number}</p>
                  <p className="text-sm text-slate-500">{order.customer?.company_name}</p>
                </div>
                <div className="text-right">
                  <Badge variant={getStatusColor(order.status) as any} size="sm">
                    {order.status.replace('_', ' ')}
                  </Badge>
                  <p className="text-sm font-medium text-slate-900 mt-1">
                    {formatCurrency(order.total_amount)}
                  </p>
                </div>
              </div>
            ))}
            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
              <p className="text-center text-slate-500 py-4">No recent orders</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Order Status Pipeline</h3>
          </div>
          <div className="space-y-3">
            {[
              { status: 'Pending', count: 12, color: 'bg-amber-500', icon: Clock },
              { status: 'In Production', count: 8, color: 'bg-blue-500', icon: Factory },
              { status: 'Quality Check', count: 5, color: 'bg-purple-500', icon: CheckCircle },
              { status: 'In Transit', count: 15, color: 'bg-cyan-500', icon: Truck },
              { status: 'Delivered', count: 45, color: 'bg-emerald-500', icon: CheckCircle },
            ].map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${item.color} bg-opacity-20 flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 ${item.color.replace('bg-', 'text-')}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{item.status}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${(item.count / 45) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {stats?.lowStockProducts && stats.lowStockProducts > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-900">Low Stock Alert</h3>
              <p className="text-sm text-amber-700">
                {stats.lowStockProducts} products are running low on stock. Review inventory levels.
              </p>
            </div>
            <Button variant="outline" className="ml-auto border-amber-300 text-amber-700 hover:bg-amber-100">
              View Products
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function CustomerDashboard({ stats }: { stats: DashboardStats | null }) {
  const { customer } = useAuth();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {customer?.company_name}</h1>
            <p className="text-blue-100 mt-1">Customer Code: {customer?.customer_code}</p>
          </div>
          <div className="text-right">
            <Badge className="bg-white/20 text-white border-white/30">
              {customer?.rating?.toUpperCase()} Partner
            </Badge>
            <p className="text-sm text-blue-100 mt-2">Credit Limit: {formatCurrency(customer?.credit_limit || 0)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={<ShoppingCart className="w-6 h-6 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Pending Orders"
          value={stats?.pendingOrders || 0}
          icon={<Clock className="w-6 h-6 text-amber-600" />}
          iconBg="bg-amber-100"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats?.outstandingPayments || 0)}
          icon={<DollarSign className="w-6 h-6 text-red-600" />}
          iconBg="bg-red-100"
        />
        <StatCard
          title="Discount"
          value={`${customer?.discount_percentage || 0}%`}
          icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
          iconBg="bg-emerald-100"
        />
      </div>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Recent Orders</h3>
        <div className="space-y-3">
          {stats?.recentOrders?.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">{order.order_number}</p>
                <p className="text-sm text-slate-500">
                  {new Date(order.order_date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <Badge variant="info" size="sm">{order.status}</Badge>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {formatCurrency(order.total_amount)}
                </p>
              </div>
            </div>
          ))}
          {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
            <p className="text-center text-slate-500 py-4">No orders yet</p>
          )}
        </div>
      </Card>
    </div>
  );
}
