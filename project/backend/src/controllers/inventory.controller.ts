import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { createError } from '../middleware/error.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 50, warehouse_id, product_id, low_stock } = req.query;

    let query = supabase
      .from('inventory')
      .select('*, product:products(*), warehouse:warehouses(*)', { count: 'exact' });

    if (warehouse_id) {
      query = query.eq('warehouse_id', warehouse_id);
    }

    if (product_id) {
      query = query.eq('product_id', product_id);
    }

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw createError(error.message, 500);
    }

    let filteredData = data;

    if (low_stock === 'true') {
      filteredData = data.filter((item: any) => {
        const reorderLevel = item.product?.reorder_level || 100;
        return item.available_quantity < reorderLevel;
      });
    }

    res.json({
      success: true,
      data: filteredData,
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

export const adjustInventory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { product_id, warehouse_id, movement_type, quantity, to_warehouse_id, notes } = req.body;

    // Record the movement
    const { error: moveError } = await supabase.from('inventory_movements').insert({
      movement_type,
      warehouse_id,
      product_id,
      to_warehouse_id: movement_type === 'transfer' ? to_warehouse_id : null,
      quantity,
      notes,
      created_by: req.user?.userId,
    });

    if (moveError) {
      throw createError(moveError.message, 400);
    }

    // Update inventory
    if (movement_type === 'in') {
      const { error } = await supabase.rpc('adjust_inventory', {
        p_product_id: product_id,
        p_warehouse_id: warehouse_id,
        p_quantity: quantity,
      });
      if (error) throw createError(error.message, 500);
    } else if (movement_type === 'out') {
      const { error } = await supabase.rpc('adjust_inventory', {
        p_product_id: product_id,
        p_warehouse_id: warehouse_id,
        p_quantity: -quantity,
      });
      if (error) throw createError(error.message, 500);
    } else if (movement_type === 'transfer' && to_warehouse_id) {
      await supabase.rpc('adjust_inventory', {
        p_product_id: product_id,
        p_warehouse_id: warehouse_id,
        p_quantity: -quantity,
      });
      await supabase.rpc('adjust_inventory', {
        p_product_id: product_id,
        p_warehouse_id: to_warehouse_id,
        p_quantity: quantity,
      });
    }

    res.json({ success: true, message: 'Inventory adjusted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getInventoryMovements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 50, product_id, warehouse_id } = req.query;

    let query = supabase
      .from('inventory_movements')
      .select('*, product:products(*), warehouse:warehouses(*)')
      .order('created_at', { ascending: false });

    if (product_id) {
      query = query.eq('product_id', product_id);
    }

    if (warehouse_id) {
      query = query.eq('warehouse_id', warehouse_id);
    }

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      throw createError(error.message, 500);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
