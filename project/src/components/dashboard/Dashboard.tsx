import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/api';
import { Card, StatCard, Badge, Button, LoadingSpinner } from '../common/StatusBadge';
import { DashboardStats } from '../../types';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Dashboard() {
  const { user, customer } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [error, setError] = useState('');

  // Extra data for customer dashboard
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user, customer]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const isCustomer = user?.role === 'customer';
      const isAdmin = user?.role === 'admin' || user?.role === 'management';

      let response;
      if (isCustomer) {
        response = await apiService.getCustomerDashboard();
        // Also fetch recent invoices and payments for customer
        const [invoicesRes, paymentsRes] = await Promise.all([
          apiService.getInvoices({ page: 1, limit: 5, customer_id: customer?.id }),
          apiService.getPayments({ page: 1, limit: 5, customer_id: customer?.id }),
        ]);
        setRecentInvoices(invoicesRes.data || []);
        setRecentPayments(paymentsRes.data || []);
      } else if (isAdmin) {
        response = await apiService.getDashboardStats();
        // For admin, we might not need invoices/payments here, they'll be in their own pages.
      } else {
        setError('You do not have permission to view this dashboard. Please contact support.');
        setIsLoading(false);
        return;
      }

      const data = response.data || {};

      setStats({
        totalOrders: data.totalOrders || 0,
        pendingOrders: data.pendingOrders || 0,
        totalRevenue: data.totalRevenue || 0,
        outstandingPayments: data.outstandingPayments || 0,
        lowStockProducts: data.lowStockProducts || 0,
        totalCustomers: data.totalCustomers || 0,
        monthlyGrowth: data.monthlyGrowth || 0,
        recentOrders: data.recentOrders || [],
        topProducts: data.topProducts || [],
      });

      setSalesData(data.salesChart || []);
      setCategoryData(data.categoryData || []);
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
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

  const formatCurrency = (amount: number) => {
    return `E ${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (user?.role === 'customer') {
    return <CustomerDashboard stats={stats} recentInvoices={recentInvoices} recentPayments={recentPayments} />;
  }

  // Admin dashboard (unchanged)
  const statusCounts: Record<string, number> = {};
  (stats?.recentOrders || []).forEach((order: any) => {
    const status = order.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  const pipelineData = Object.entries(statusCounts).map(([status, count]) => ({
    status: status.replace(/_/g, ' '),
    count,
    color: {
      pending: 'bg-amber-500',
      confirmed: 'bg-blue-500',
      in_production: 'bg-purple-500',
      quality_check: 'bg-indigo-500',
      ready_for_dispatch: 'bg-cyan-500',
      in_transit: 'bg-blue-600',
      delivered: 'bg-emerald-500',
      cancelled: 'bg-red-500',
    }[status] || 'bg-slate-500',
    icon: {
      pending: Clock,
      confirmed: CheckCircle,
      in_production: Factory,
      quality_check: CheckCircle,
      ready_for_dispatch: Package,
      in_transit: Truck,
      delivered: CheckCircle,
      cancelled: AlertTriangle,
    }[status] || Clock,
  }));

  const totalPipeline = pipelineData.reduce((sum, item) => sum + item.count, 0) || 1;

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
          <Link to="/reports">
            <Button>
              <TrendingUp className="w-4 h-4 mr-2" />
              View Reports
            </Button>
          </Link>
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
            <span className="text-sm text-slate-500">
              {salesData.length > 0 ? 'Last 6 months' : 'No sales data available'}
            </span>
          </div>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-500">
              No sales data available
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Product Categories</h3>
          {categoryData.length > 0 ? (
            <>
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
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              No category data available
            </div>
          )}
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
            {pipelineData.length > 0 ? (
              pipelineData.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.status} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${item.color} bg-opacity-20 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${item.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700">{item.status}</span>
                        <span className="text-sm font-semibold text-slate-900">{item.count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: `${(item.count / totalPipeline) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-slate-500 py-4">No order data available</p>
            )}
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

// ========== Enhanced Customer Dashboard ==========
function CustomerDashboard({
  stats,
  recentInvoices,
  recentPayments,
}: {
  stats: DashboardStats | null;
  recentInvoices: any[];
  recentPayments: any[];
}) {
  const { customer } = useAuth();

  const formatCurrency = (amount: number) => {
    return `E ${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  // Calculate credit utilization
  const creditUtilization = customer?.credit_limit
    ? Math.round(((customer.current_outstanding || 0) / customer.credit_limit) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Credit Utilization */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
        {customer?.credit_limit && customer?.credit_limit > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span>Credit Utilization</span>
              <span>{creditUtilization}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full rounded-full transition-all ${
                  creditUtilization > 80 ? 'bg-red-400' : creditUtilization > 60 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(creditUtilization, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
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
          title="Total Spent"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
          iconBg="bg-emerald-100"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats?.outstandingPayments || 0)}
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          iconBg="bg-red-100"
        />
      </div>

      {/* Recent Orders */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Recent Orders</h3>
          <a href="/orders" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </a>
        </div>
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

      {/* Two-column: Invoices & Payments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Invoices</h3>
            <a href="/invoices" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          {recentInvoices.length === 0 ? (
            <p className="text-center text-slate-500 py-4">No invoices</p>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{inv.invoice_number}</p>
                    <p className="text-sm text-slate-500">{new Date(inv.issue_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={inv.payment_status === 'paid' ? 'success' : 'warning'} size="sm">
                      {inv.payment_status}
                    </Badge>
                    <p className="text-sm font-semibold text-slate-900 mt-1">
                      {formatCurrency(inv.total_amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Payments */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Payments</h3>
            <a href="/payments" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-center text-slate-500 py-4">No payments</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((pmt) => (
                <div key={pmt.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{pmt.payment_number}</p>
                    <p className="text-sm text-slate-500">{new Date(pmt.payment_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="default" size="sm">{pmt.payment_method}</Badge>
                    <p className="text-sm font-semibold text-emerald-600 mt-1">
                      {formatCurrency(pmt.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Discount & Rating info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-slate-500">Discount Percentage</p>
          <p className="text-2xl font-bold text-emerald-600">{customer?.discount_percentage || 0}%</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Customer Rating</p>
          <Badge className="mt-1 capitalize" variant="default">
            {customer?.rating || 'N/A'}
          </Badge>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total Purchases</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
        </Card>
      </div>
    </div>
  );
}