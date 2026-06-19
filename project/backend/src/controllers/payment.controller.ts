import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { createError } from '../middleware/error.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getPayments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, customer_id } = req.query;

    let query = supabase
      .from('payments')
      .select('*, customer:customers(*), invoice:invoices(*)', { count: 'exact' });

    if (req.user?.role === 'customer' && req.user?.customerId) {
      query = query.eq('customer_id', req.user.customerId);
    } else if (customer_id) {
      query = query.eq('customer_id', customer_id);
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

export const createPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { invoice_id, customer_id, amount, payment_method, reference_number, bank_name, notes } = req.body;

    const paymentNumber = `PAY-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
      .from('payments')
      .insert({
        payment_number: paymentNumber,
        invoice_id,
        customer_id,
        amount,
        payment_method: payment_method || 'bank_transfer',
        reference_number,
        bank_name,
        notes,
        received_by: req.user?.userId,
      })
      .select()
      .single();

    if (error) {
      throw createError(error.message, 400);
    }

    // Update invoice
    if (invoice_id) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoice_id)
        .single();

      if (invoice) {
        const newAmountPaid = invoice.amount_paid + amount;
        const newStatus = newAmountPaid >= invoice.total_amount ? 'paid' : 'partial';

        await supabase
          .from('invoices')
          .update({ amount_paid: newAmountPaid, payment_status: newStatus })
          .eq('id', invoice_id);
      }
    }

    // Update customer outstanding
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customer_id)
      .single();

    if (customer) {
      await supabase
        .from('customers')
        .update({ current_outstanding: Math.max(0, customer.current_outstanding - amount) })
        .eq('id', customer_id);
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
