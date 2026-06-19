import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { createError } from '../middleware/error.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getCustomers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, search, type, rating } = req.query;

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,customer_code.ilike.%${search}%`);
    }

    if (type) {
      query = query.eq('customer_type', type);
    }

    if (rating) {
      query = query.eq('rating', rating);
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

export const getCustomerById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw createError('Customer not found', 404);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerCode = `CUS-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
      .from('customers')
      .insert({
        customer_code: customerCode,
        ...req.body,
        country: req.body.country || 'India',
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

export const updateCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('customers')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw createError(error.message, 400);
    }

    if (!data) {
      throw createError('Customer not found', 404);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      throw createError(error.message, 400);
    }

    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getCustomerOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*, product:products(*))')
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      throw createError(error.message, 500);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateCustomerRating = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    const discountMap = { gold: 20, silver: 10, bronze: 5 };
    const discount_percentage = discountMap[rating as keyof typeof discountMap] || 5;

    const { data, error } = await supabase
      .from('customers')
      .update({ rating, discount_percentage })
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
