import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { createError } from '../middleware/error.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getRejections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    let query = supabase
      .from('material_rejections')
      .select('*, customer:customers(*), product:products(*)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
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

export const createRejection = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { order_id, invoice_id, customer_id, product_id, quantity, reason } = req.body;

    const rejectionNumber = `REJ-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
      .from('material_rejections')
      .insert({
        rejection_number: rejectionNumber,
        order_id,
        invoice_id,
        customer_id,
        product_id,
        quantity,
        reason,
        rejection_date: new Date().toISOString(),
        status: 'pending',
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

export const resolveRejection = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { resolution, credit_issued, notes } = req.body;

    const { data, error } = await supabase
      .from('material_rejections')
      .update({
        status: 'resolved',
        resolution,
        credit_issued,
        resolution_date: new Date().toISOString(),
        notes,
      })
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
