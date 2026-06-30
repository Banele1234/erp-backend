import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { createError } from '../middleware/error.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Get user from database
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !users) {
      throw createError('Invalid credentials', 401);
    }

    // Use Supabase Auth to verify password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw createError('Invalid credentials', 401);
    }

    // Get customer data if user is a customer
    let customer = null;
    if (users.role === 'customer') {
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', users.id)
        .single();
      customer = customerData;
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: users.id,
        email: users.email,
        role: users.role,
        customerId: customer?.id,
      } as object,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: users.id,
          email: users.email,
          full_name: users.full_name,
          role: users.role,
        },
        customer: customer ? {
          id: customer.id,
          company_name: customer.company_name,
          customer_code: customer.customer_code,
          rating: customer.rating,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, full_name, company_name, phone, customer_type, address, city, state, pincode, gst_number } = req.body;

    // 1. Create user using Admin API (bypasses rate limits & email confirmation)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto‑confirm – no email sent
      user_metadata: { full_name, company_name },
    });

    if (authError) {
      console.error('Admin createUser error:', authError);
      throw createError(authError.message, 400);
    }

    // Ensure we have a user ID
    if (!authData.user?.id) {
      console.error('User ID missing after admin create:', authData);
      throw createError('Failed to create user – missing user ID', 500);
    }

    // 2. Insert into public.users
    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      full_name,
      password_hash: 'supabase_auth',
      role: 'customer',
      is_active: true,
    });

    if (userError) {
      console.error('Supabase user insert error:', userError);
      throw createError(`Failed to create user: ${userError.message}`, 500);
    }

    // 3. Create customer record
    const customerCode = `CUS-${Date.now().toString(36).toUpperCase()}`;

    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .insert({
        user_id: authData.user.id,
        customer_code: customerCode,
        company_name,
        contact_person: full_name,
        phone,
        address,
        city,
        state,
        pincode,
        gst_number,
        customer_type: customer_type || 'regular_dealer',
        rating: 'bronze',
        credit_limit: 100000,
        country: 'India',
      })
      .select()
      .single();

    if (customerError) {
      console.error('Supabase customer insert error:', customerError);
      throw createError(`Failed to create customer: ${customerError.message}`, 500);
    }

    // 4. Generate JWT
    const token = jwt.sign(
      {
        userId: authData.user.id,
        email,
        role: 'customer',
        customerId: customerData.id,
      } as object,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: authData.user.id,
          email,
          full_name,
          role: 'customer',
        },
        customer: customerData,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user?.userId)
      .single();

    if (!user) {
      throw createError('User not found', 404);
    }

    let customer = null;
    if (user.role === 'customer') {
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      customer = customerData;
    }

    res.json({
      success: true,
      data: { user, customer },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await supabase.auth.signOut();
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      throw createError('Failed to refresh token', 401);
    }

    const token = jwt.sign(
      {
        userId: data.user?.id,
        email: data.user?.email,
        role: req.user?.role,
        customerId: req.user?.customerId,
      } as object,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: { token },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// UPDATE PROFILE (new)
// ============================================================
export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw createError('Unauthorized', 401);
    }

    const { full_name, company_name, phone, address, city, state, pincode, gst_number } = req.body;

    // 1. Update user's full_name
    const { error: userError } = await supabase
      .from('users')
      .update({ full_name, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (userError) {
      console.error('Update user error:', userError);
      throw createError('Failed to update user', 500);
    }

    // 2. Update customer record (if exists)
    const { data: customer, error: customerFetchError } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (customerFetchError && customerFetchError.code !== 'PGRST116') {
      throw customerFetchError;
    }

    if (customer) {
      const { error: customerUpdateError } = await supabase
        .from('customers')
        .update({
          company_name,
          contact_person: full_name, // keep in sync
          phone,
          address,
          city,
          state,
          pincode,
          gst_number,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customer.id);

      if (customerUpdateError) {
        console.error('Update customer error:', customerUpdateError);
        throw createError('Failed to update customer', 500);
      }
    }

    // 3. Fetch updated user and customer
    const { data: updatedUser, error: userFetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userFetchError) throw userFetchError;

    let updatedCustomer = null;
    if (updatedUser.role === 'customer') {
      const { data: custData } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .single();
      updatedCustomer = custData;
    }

    res.json({
      success: true,
      data: {
        user: updatedUser,
        customer: updatedCustomer,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    next(error);
  }
};