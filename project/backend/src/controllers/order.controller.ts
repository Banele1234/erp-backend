import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { createError } from '../middleware/error.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, search, status, customer_id } = req.query;

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' });

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

    // Fetch customer details separately
    const customerIds = [...new Set(data?.map(o => o.customer_id) || [])];
    let customersMap: Record<string, any> = {};
    if (customerIds.length) {
      const { data: customers } = await supabase
        .from('customers')
        .select('id, company_name, contact_person, phone, email, address, city, state, pincode, gst_number, rating, customer_code')
        .in('id', customerIds);
      customersMap = (customers || []).reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
    }

    const ordersWithCustomer = data?.map(o => ({
      ...o,
      customer: customersMap[o.customer_id] || null,
    })) || [];

    res.json({
      success: true,
      data: ordersWithCustomer,
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
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw createError('Order not found', 404);
    }

    let customer = null;
    if (data.customer_id) {
      const { data: custData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', data.customer_id)
        .single();
      customer = custData;
    }

    let items = [];
    try {
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*, product:products(*)')
        .eq('order_id', id);
      items = itemsData || [];
    } catch (itemsErr) {
      console.warn('Could not fetch order items:', itemsErr);
    }

    res.json({
      success: true,
      data: {
        ...data,
        customer,
        items,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { customer_id, warehouse_id, items, required_date, notes, shipping_address, shipping_city, shipping_state, shipping_pincode } = req.body;

    let subtotal = 0;
    let taxAmount = 0;

    const productIds = items.map((item: any) => item.product_id);
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

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
      try {
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems.map((item: any) => ({ ...item, order_id: orderData.id })));

        if (itemsError) {
          console.warn('⚠️ Failed to insert order items:', itemsError);
        }
      } catch (itemsErr) {
        console.warn('⚠️ Error inserting order items:', itemsErr);
      }
    }

    // =============================================
    //        CREATE NOTIFICATIONS (with logs)
    // =============================================

    // 1. Notify the customer
    if (customer?.user_id) {
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: customer.user_id,
        title: 'Order Placed',
        message: `Your order ${orderNumber} has been placed successfully.`,
        type: 'order',
        reference_id: orderData.id,
      });
      if (notifError) {
        console.error('❌ Failed to notify customer:', notifError);
      } else {
        console.log(`✅ Notification sent to customer ${customer.user_id}`);
      }
    } else {
      console.warn(`⚠️ Customer ${customer_id} has no user_id – cannot send notification.`);
    }

    // 2. Notify all staff (admin, management, warehouse_staff)
    const { data: staffUsers, error: staffError } = await supabase
      .from('users')
      .select('id, role')
      .in('role', ['admin', 'management', 'warehouse_staff']);

    if (staffError) {
      console.error('❌ Failed to fetch staff users:', staffError);
    } else {
      console.log(`👥 Found ${staffUsers?.length || 0} staff users:`, staffUsers?.map(u => `${u.role} (${u.id.slice(0,8)})`).join(', '));

      if (staffUsers && staffUsers.length) {
        const notifications = staffUsers.map(u => ({
          user_id: u.id,
          title: 'New Order',
          message: `Order ${orderNumber} has been placed by ${customer?.company_name || 'a customer'}`,
          type: 'order',
          reference_id: orderData.id,
        }));

        const { error: bulkError } = await supabase.from('notifications').insert(notifications);
        if (bulkError) {
          console.error('❌ Bulk insert failed:', bulkError);
          // Fallback: insert one by one
          console.log('🔄 Attempting fallback (single inserts)...');
          let successCount = 0;
          for (const notif of notifications) {
            const { error } = await supabase.from('notifications').insert(notif);
            if (error) {
              console.error(`❌ Failed to insert for user ${notif.user_id}:`, error);
            } else {
              successCount++;
            }
          }
          console.log(`✅ Fallback inserted ${successCount} of ${notifications.length} notifications.`);
        } else {
          console.log(`✅ Notifications sent to ${staffUsers.length} staff users`);
        }
      } else {
        console.warn('⚠️ No staff users found – check that roles are set correctly in users table.');
      }
    }

    // 3. Notify the creator (if different from customer & not already staff)
    const creatorId = req.user?.userId;
    if (creatorId && creatorId !== customer?.user_id) {
      const isStaff = staffUsers?.some(u => u.id === creatorId);
      if (!isStaff) {
        const { error: creatorError } = await supabase.from('notifications').insert({
          user_id: creatorId,
          title: 'Order Created',
          message: `You created order ${orderNumber} for ${customer?.company_name || 'customer'}.`,
          type: 'order',
          reference_id: orderData.id,
        });
        if (creatorError) {
          console.error('❌ Failed to notify creator:', creatorError);
        } else {
          console.log(`✅ Notification sent to creator ${creatorId}`);
        }
      }
    }

    res.status(201).json({ success: true, data: orderData });
  } catch (error) {
    console.error('❌ Order creation error:', error);
    next(error);
  }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 1. Update the order status
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('*, customer:customers(*)')
      .single();

    if (error) throw createError(error.message, 400);

    // 2. Send notifications based on the new status
    const customerUserId = order.customer?.user_id;
    const orderNumber = order.order_number;

    // Status-specific messages for the customer
    const statusMessages: Record<string, string> = {
      confirmed: `Your order ${orderNumber} has been confirmed.`,
      in_production: `Your order ${orderNumber} is now in production.`,
      quality_check: `Your order ${orderNumber} is in quality check.`,
      ready_for_dispatch: `Your order ${orderNumber} is ready for dispatch.`,
      in_transit: `Your order ${orderNumber} is on the way.`,
      delivered: `Your order ${orderNumber} has been delivered.`,
      cancelled: `Your order ${orderNumber} has been cancelled.`,
    };

    // 3. Notify the customer (if they exist)
    if (customerUserId && statusMessages[status]) {
      await supabase.from('notifications').insert({
        user_id: customerUserId,
        title: `Order ${status.replace('_', ' ')}`,
        message: statusMessages[status],
        type: 'order',
        reference_id: order.id,
      });
    }

    // 4. Notify staff (admin, management, warehouse_staff) for important statuses
    const staffStatuses = ['confirmed', 'in_production', 'ready_for_dispatch', 'in_transit'];
    if (staffStatuses.includes(status)) {
      const { data: staffUsers } = await supabase
        .from('users')
        .select('id')
        .in('role', ['admin', 'management', 'warehouse_staff']);

      if (staffUsers && staffUsers.length) {
        const staffNotifications = staffUsers.map(u => ({
          user_id: u.id,
          title: `Order ${status.replace('_', ' ')}`,
          message: `Order ${orderNumber} has been ${status.replace('_', ' ')}.`,
          type: 'order',
          reference_id: order.id,
        }));
        await supabase.from('notifications').insert(staffNotifications);
      }
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select('*, customer:customers(*)')
      .single();

    if (error) throw createError(error.message, 400);

    // Notify the customer
    if (order.customer?.user_id) {
      await supabase.from('notifications').insert({
        user_id: order.customer.user_id,
        title: 'Order Cancelled',
        message: `Your order ${order.order_number} has been cancelled.`,
        type: 'order',
        reference_id: order.id,
      });
    }

    // Notify staff
    const { data: staffUsers } = await supabase
      .from('users')
      .select('id')
      .in('role', ['admin', 'management', 'warehouse_staff']);

    if (staffUsers && staffUsers.length) {
      const notifications = staffUsers.map(u => ({
        user_id: u.id,
        title: 'Order Cancelled',
        message: `Order ${order.order_number} has been cancelled.`,
        type: 'order',
        reference_id: order.id,
      }));
      await supabase.from('notifications').insert(notifications);
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};