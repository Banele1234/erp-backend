import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { createError } from '../middleware/error.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getProduction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    let query = supabase
      .from('production_tracking')
      .select('*, product:products(*)', { count: 'exact' });

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

export const createProductionBatch = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { product_id, planned_quantity, factory, expected_completion_date } = req.body;

    const batchNumber = `BATCH-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
      .from('production_tracking')
      .insert({
        batch_number: batchNumber,
        product_id,
        planned_quantity,
        factory,
        expected_completion_date,
        start_date: new Date().toISOString(),
        status: 'in_progress',
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

export const updateProductionProgress = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { produced_quantity, rejected_quantity, status, actual_completion_date, notes } = req.body;

    const { data, error } = await supabase
      .from('production_tracking')
      .update({
        produced_quantity,
        rejected_quantity,
        status,
        actual_completion_date,
        notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw createError(error.message, 400);
    }

    // If production is completed, update inventory
    if (status === 'completed' && produced_quantity > 0) {
      // Find a default warehouse or use the first active one
      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id')
        .eq('is_active', true)
        .limit(1);

      if (warehouses && warehouses.length > 0) {
        await supabase.rpc('adjust_inventory', {
          p_product_id: data.product_id,
          p_warehouse_id: warehouses[0].id,
          p_quantity: produced_quantity,
        });
      }
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
