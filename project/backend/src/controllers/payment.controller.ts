import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { createError } from '../middleware/error.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getPayments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, customer_id } = req.query;

    // 1. Build query for payments (no nested joins)
    let query = supabase
      .from('payments')
      .select('*', { count: 'exact' });

    if (req.user?.role === 'customer' && req.user?.customerId) {
      query = query.eq('customer_id', req.user.customerId);
    } else if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    query = query.range(from, to).order('payment_date', { ascending: false });

    const { data: payments, error, count } = await query;

    if (error) {
      throw createError(error.message, 500);
    }

    // 2. Fetch customer details separately
    const customerIds = [...new Set(payments?.map(p => p.customer_id).filter(Boolean))];
    let customersMap: Record<string, any> = {};
    if (customerIds.length) {
      const { data: customers } = await supabase
        .from('customers')
        .select('id, company_name, customer_code, rating')
        .in('id', customerIds);
      customersMap = (customers || []).reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
    }

    // 3. Fetch invoice details separately
    const invoiceIds = [...new Set(payments?.map(p => p.invoice_id).filter(Boolean))];
    let invoicesMap: Record<string, any> = {};
    if (invoiceIds.length) {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, payment_status, total_amount, amount_paid')
        .in('id', invoiceIds);
      invoicesMap = (invoices || []).reduce((acc, inv) => ({ ...acc, [inv.id]: inv }), {});
    }

    // 4. Attach customer and invoice to each payment
    const paymentsWithDetails = payments?.map(p => ({
      ...p,
      customer: customersMap[p.customer_id] || null,
      invoice: invoicesMap[p.invoice_id] || null,
    })) || [];

    res.json({
      success: true,
      data: paymentsWithDetails,
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

export const getPaymentById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !payment) {
      throw createError('Payment not found', 404);
    }

    // Fetch customer
    let customer = null;
    if (payment.customer_id) {
      const { data: custData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', payment.customer_id)
        .single();
      customer = custData;
    }

    // Fetch invoice
    let invoice = null;
    if (payment.invoice_id) {
      const { data: invData } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', payment.invoice_id)
        .single();
      invoice = invData;
    }

    res.json({
      success: true,
      data: {
        ...payment,
        customer,
        invoice,
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
        payment_date: new Date().toISOString(),
        status: 'completed',
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
        const newAmountPaid = (invoice.amount_paid || 0) + amount;
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

export const updatePayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('payments')
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