import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { createError } from '../middleware/error.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getInvoices = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, payment_status, customer_id } = req.query;

    let query = supabase
      .from('invoices')
      .select('*, customer:customers(*), order:orders(*)', { count: 'exact' });

    if (req.user?.role === 'customer' && req.user?.customerId) {
      query = query.eq('customer_id', req.user.customerId);
    } else if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw createError(error.message, 500);
    }

    res.json({
      success: true,
      data: data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('invoices')
      .select('*, customer:customers(*), order:orders(*, items:order_items(*, product:products(*)))')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw createError('Invoice not found', 404);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { order_id, customer_id, due_date, notes } = req.body;

    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', order_id)
      .single();

    if (!order) {
      throw createError('Order not found', 404);
    }

    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    const dueDate = due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        order_id,
        customer_id,
        invoice_date: new Date().toISOString(),
        due_date: dueDate,
        subtotal: order.subtotal,
        discount_amount: order.discount_amount,
        tax_amount: order.tax_amount,
        total_amount: order.total_amount,
        amount_paid: 0,
        payment_status: 'pending',
        notes,
      })
      .select()
      .single();

    if (error) {
      throw createError(error.message, 400);
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateInvoice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('invoices')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw createError(error.message, 400);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
