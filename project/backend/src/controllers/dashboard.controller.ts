import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { createError } from '../middleware/error.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

// ========== ADMIN / MANAGEMENT DASHBOARD ==========
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Fetch all required data in parallel
    const [ordersRes, customersRes, invoicesRes, inventoryRes] = await Promise.all([
      supabase.from('orders').select('*, customer:customers(*)').order('created_at', { ascending: false }).limit(10),
      supabase.from('customers').select('*', { count: 'exact', head: false }),
      supabase.from('invoices').select('*'),
      supabase.from('inventory').select('*, product:products(*)').lt('quantity', 100),
    ]);

    const orders = ordersRes.data || [];
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const outstanding = invoicesRes.data?.filter(i => i.payment_status !== 'paid').reduce((sum, i) => sum + (i.amount_due || 0), 0) || 0;

    // Generate sales chart (last 6 months) – can be replaced with real DB aggregation
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const salesChart = months.map(month => ({
      month,
      sales: Math.floor(Math.random() * 50000) + 30000,
      orders: Math.floor(Math.random() * 30) + 40,
    }));

    // Product categories (sample – you can compute from real data)
    const categoryData = [
      { name: 'Fast Moving', value: 35 },
      { name: 'Regular', value: 40 },
      { name: 'Seasonal', value: 15 },
      { name: 'Slow Moving', value: 10 },
    ];

    res.json({
      success: true,
      data: {
        totalOrders: orders.length,
        pendingOrders,
        totalRevenue,
        outstandingPayments: outstanding,
        totalCustomers: customersRes.count || 0,
        lowStockProducts: inventoryRes.data?.length || 0,
        monthlyGrowth: 12.5, // calculate from previous month if you have historical data
        recentOrders: orders.slice(0, 5),
        topProducts: [],
        salesChart,
        categoryData,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    next(error);
  }
};

// ========== CUSTOMER DASHBOARD (with auto‑create) ==========
export const getCustomerDashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw createError('Unauthorized', 401);

    // 1. Try to get the customer record
    let { data: customer, error: custError } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    // 2. If not found, create one automatically
    if (custError && custError.code === 'PGRST116') {
      // Get user details from the users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw createError('User not found', 404);
      }

      const customerCode = `CUS-${Date.now().toString(36).toUpperCase()}`;
      const newCustomer = {
        user_id: userId,
        customer_code: customerCode,
        company_name: user.full_name || 'Customer',
        contact_person: user.full_name || '',
        email: user.email || '',
        rating: 'bronze',
        credit_limit: 100000,
        country: 'India',
        is_active: true,
        total_purchases: 0,
        current_outstanding: 0,
        discount_percentage: 0,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('customers')
        .insert(newCustomer)
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create customer profile:', insertError);
        throw createError('Could not create customer profile', 500);
      }
      customer = inserted;
    } else if (custError) {
      throw createError(custError.message, 500);
    }

    // 3. Fetch orders and invoices for this customer
    const [ordersRes, invoicesRes] = await Promise.all([
      supabase.from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('invoices')
        .select('*')
        .eq('customer_id', customer.id),
    ]);

    const orders = ordersRes.data || [];
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const outstanding = invoicesRes.data?.filter(i => i.payment_status !== 'paid').reduce((sum, i) => sum + (i.amount_due || 0), 0) || 0;

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        totalRevenue: totalSpent,
        outstandingPayments: outstanding,
        totalCustomers: 1,
        lowStockProducts: 0,
        monthlyGrowth: 0,
        recentOrders: orders.slice(0, 5),
        topProducts: [],
        customer, // include full customer object for the frontend
      },
    });
  } catch (error) {
    console.error('Customer dashboard error:', error);
    next(error);
  }
};

// ========== SALES CHART (optional) ==========
export const getSalesChartData = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { period = 'month' } = req.query;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = months.map(month => ({
      month,
      sales: Math.floor(Math.random() * 50000) + 30000,
      orders: Math.floor(Math.random() * 30) + 40,
    }));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// ========== TOP PRODUCTS (fallback) ==========
export const getTopProducts = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Return fallback data – you can replace with real logic later
    res.json({
      success: true,
      data: [
        { name: 'Battery Cell A', sold: 128, revenue: 28400 },
        { name: 'Brake Pad Set', sold: 96, revenue: 19200 },
        { name: 'Oil Filter X', sold: 84, revenue: 16800 },
        { name: 'Spark Plug Pro', sold: 72, revenue: 14400 },
      ],
    });
  } catch (error) {
    next(error);
  }
};