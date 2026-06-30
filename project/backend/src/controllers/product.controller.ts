import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { createError } from '../middleware/error.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, search, category, active } = req.query;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,product_code.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (active !== undefined) {
      query = query.eq('is_active', active === 'true');
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

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw createError('Product not found', 404);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      description,
      category,
      unit,
      unit_price,
      cost_price,
      gst_percentage,
      reorder_level,
      eoq,
      weight_kg,
      warehouse_id,      // optional
      initial_quantity,  // optional (default 0)
    } = req.body;

    const productCode = `PRD-${Date.now().toString(36).toUpperCase()}`;

    // Insert product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        product_code: productCode,
        name,
        description,
        category,
        unit,
        unit_price,
        cost_price,
        gst_percentage,
        reorder_level,
        eoq,
        weight_kg,
        is_active: true,
      })
      .select()
      .single();

    if (productError) {
      throw createError(productError.message, 400);
    }

    // If warehouse_id is provided, insert inventory record
    if (warehouse_id) {
      const quantity = initial_quantity || 0;
      const { error: invError } = await supabase
        .from('inventory')
        .insert({
          product_id: product.id,
          warehouse_id: warehouse_id,
          quantity: quantity,
          reserved_quantity: 0,
          available_quantity: quantity,
        });

      if (invError) {
        console.warn('⚠️ Failed to create inventory record:', invError);
        // Not failing the request – product created, but inventory not set.
      }
    }

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw createError(error.message, 400);
    }

    if (!data) {
      throw createError('Product not found', 404);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw createError(error.message, 400);
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getProductInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('inventory')
      .select('*, warehouse:warehouses(*)')
      .eq('product_id', id);

    if (error) {
      throw createError(error.message, 500);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};