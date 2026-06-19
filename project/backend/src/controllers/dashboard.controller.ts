import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { createError } from '../middleware/error.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [ordersRes, customersRes, invoicesRes, inventoryRes] = await Promise.all([
      supabase.from('orders').select('*'),
      supabase.from('customers').select('*', { count: 'exact' }),
      supabase.from('invoices').select('*'),
      supabase.from('inventory').select('*, product:products(*)').lt('quantity', 100),
    ]);

    const orders = ordersRes.data || [];
    const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const outstanding = invoicesRes.data?.filter(i => i.payment_status !== 'paid').reduce((sum, i) => sum + i.amount_due, 0) || 0;

    res.json({
      success: true,
      data: {
        totalOrders: orders.length,
        pendingOrders,
        totalRevenue,
        outstandingPayments: outstanding,
        totalCustomers: customersRes.count || 0,
        lowStockProducts: inventoryRes.data?.length || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerDashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user?.customerId;

    if (!customerId) {
      throw createError('Customer not found', 404);
    }

    const [ordersRes, invoicesRes, customerRes] = await Promise.all([
      supabase.from('orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }).limit(5),
      supabase.from('invoices').select('*').eq('customer_id', customerId),
      supabase.from('customers').select('*').eq('id', customerId).single(),
    ]);

    const orders = ordersRes.data || [];
    const outstanding = invoicesRes.data?.filter(i => i.payment_status !== 'paid').reduce((sum, i) => sum + i.amount_due, 0) || 0;

    res.json({
      success: true,
      data: {
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length,
        totalSpent: customerRes.data?.total_purchases || 0,
        outstanding,
        creditLimit: customerRes.data?.credit_limit || 0,
        discount: customerRes.data?.discount_percentage || 0,
        rating: customerRes.data?.rating,
        recentOrders: orders.slice(0, 5),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesChartData = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { period = 'month' } = req.query;

    // Generate sample data for demonstration
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

export const getTopProducts = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { limit = 10 } = req.query;

    const { data, error } = await supabase
      .from('order_items')
      .select('product_id, quantity, product:products(*)')
      .limit(Number(limit));

    if (error) {
      throw createError(error.message, 500);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
