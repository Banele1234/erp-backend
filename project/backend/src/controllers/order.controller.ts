import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { createError } from '../middleware/error.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, search, status, customer_id } = req.query;

    let query = supabase
      .from('orders')
      .select('*, customer:customers(*), warehouse:warehouses(*), items:order_items(*, product:products(*))', { count: 'exact' });

    // If user is customer, only show their orders
    if (req.user?.role === 'customer' && req.user?.customerId) {
      query = query.eq('customer_id', req.user.customerId);
    } else if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    if (search) {
      query = query.ilike('order_number', `%${search}%`);
    }

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

export const getOrderById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select('*, customer:customers(*), warehouse:warehouses(*), items:order_items(*, product:products(*))')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw createError('Order not found', 404);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { customer_id, warehouse_id, items, required_date, notes, shipping_address, shipping_city, shipping_state, shipping_pincode } = req.body;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    // Get product details
    const productIds = items.map((item: any) => item.product_id);
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Get customer discount
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customer_id)
      .single();

    const discountPercentage = customer?.discount_percentage || 0;

    const orderItems = items.map((item: any) => {
      const product = products?.find((p: any) => p.id === item.product_id);
      const lineTotal = (product?.unit_price || 0) * item.quantity;
      const tax = lineTotal * ((product?.gst_percentage || 18) / 100);
      subtotal += lineTotal;
      taxAmount += tax;
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product?.unit_price || 0,
        discount_percentage: discountPercentage,
        tax_percentage: product?.gst_percentage || 18,
        line_total: lineTotal,
      };
    });

    const discountAmount = subtotal * (discountPercentage / 100);
    const totalAmount = subtotal - discountAmount + taxAmount;

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id,
        warehouse_id,
        required_date,
        notes,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_pincode,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'pending',
        created_by: req.user?.userId,
      })
      .select()
      .single();

    if (orderError) {
      throw createError(orderError.message, 400);
    }

    // Insert order items
    if (orderData && orderItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems.map((item: any) => ({ ...item, order_id: orderData.id })));

      if (itemsError) {
        throw createError(itemsError.message, 400);
      }
    }

    // Create notification
    await supabase.from('notifications').insert({
      user_id: req.user?.userId,
      title: 'New Order Created',
      message: `Order ${orderNumber} has been created`,
      type: 'order',
      reference_id: orderData.id,
    });

    res.status(201).json({ success: true, data: orderData });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
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

export const cancelOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
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
